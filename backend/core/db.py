import sqlite3
import pandas as pd
import os
from datetime import datetime
import json

# Cloud-Friendly Configuration
# Uses environment variable if set (for Cloud), otherwise defaults to local relative path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # points to backend/
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "farm_data.db")

DB_FILE = os.getenv("DB_PATH", DEFAULT_DB_PATH)

def get_connection():
    if not os.path.exists(DB_FILE):
        print(f"⚠️ Warning: Database file not found at {DB_FILE}")
    
    conn = sqlite3.connect(DB_FILE)
    # Enable Foreign Keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """
    Initializes the database with the Enterprise Schema if tables don't exist.
    """
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Surveys (Existing)
    c.execute("""CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_date TEXT,
        total_palms INTEGER,
        avg_health REAL
    )""")
    
    # 2. Tracked Palms (Single Source of Truth for Physical Trees)
    # lat/lon are the unique identifiers for a physical tree
    c.execute("""CREATE TABLE IF NOT EXISTS tracked_palms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        custom_name TEXT,
        lat REAL,
        lon REAL,
        planted_date TEXT,
        last_health_score REAL,
        status TEXT DEFAULT 'Healthy'
    )""")
    
    # 3. Palm History (Links specific scans to specific tracked trees)
    c.execute("""CREATE TABLE IF NOT EXISTS palm_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracked_palm_id INTEGER,
        survey_id INTEGER,
        health_score REAL,
        yield_est REAL,
        img_path TEXT,
        FOREIGN KEY(tracked_palm_id) REFERENCES tracked_palms(id),
        FOREIGN KEY(survey_id) REFERENCES surveys(id)
    )""")
    
    # 4. Financial Config (Real User Data)
    c.execute("""CREATE TABLE IF NOT EXISTS financial_config (
        key TEXT PRIMARY KEY,
        value REAL,
        updated_at TEXT
    )""")
    
    # 5. Tasks (Automated Ops)
    c.execute("""CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT, -- 'Fertilize', 'PestControl', 'Harvest'
        target_palm_id INTEGER,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Done'
        assigned_to TEXT,
        created_at TEXT,
        FOREIGN KEY(target_palm_id) REFERENCES tracked_palms(id)
    )""")
    
    # Pre-populate Financial Config if empty
    c.execute("SELECT count(*) FROM financial_config")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO financial_config (key, value, updated_at) VALUES (?, ?, ?)", [
            ('oil_price_per_ton', 850.0, datetime.utcnow().isoformat()),
            ('fertilizer_cost_per_kg', 1.5, datetime.utcnow().isoformat()),
            ('labor_cost_per_hour', 12.0, datetime.utcnow().isoformat())
        ])

    conn.commit()
    conn.close()

# Initialize on module load (safe for dev)
if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
    # Build dir if needed
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    # Create empty file immediately to avoid connection errors
    with open(DB_FILE, 'w') as f: pass

init_db()

def get_all_surveys_df():
    conn = get_connection()
    try:
        df = pd.read_sql_query("SELECT * FROM surveys ORDER BY id ASC", conn)
    except Exception as e:
        print(f"DB Error: {e}")
        df = pd.DataFrame()
    finally:
        conn.close()
    return df

def get_survey_history():
    """Returns clean list of all surveys for Reports page."""
    conn = get_connection()
    try:
        c = conn.cursor()
        c.execute("SELECT id, scan_date, total_palms, avg_health FROM surveys ORDER BY id DESC")
        rows = c.fetchall()
        return [{"id": r[0], "date": r[1], "count": r[2], "health": r[3]} for r in rows]
    finally:
        conn.close()

def get_latest_palms_df():
    conn = get_connection()
    try:
        c = conn.cursor()
        c.execute("SELECT MAX(id) FROM surveys")
        res = c.fetchone()
        last_id = res[0] if res else None
        
        if last_id is None:
            return pd.DataFrame()
            
        # Legacy support: if 'palms' table exists, use it, otherwise join new tables
        # For now, let's assume we are migrating.
        # Check if 'palms' table exists (legacy)
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='palms'")
        if c.fetchone():
             df = pd.read_sql_query(f"SELECT * FROM palms WHERE survey_id = {last_id}", conn)
        else:
             # Construct DF from new schema
             query = f"""
                SELECT 
                    ph.id as id,
                    ph.survey_id,
                    ph.tracked_palm_id as palm_id_track,
                    tp.lat as x_coord, -- Mapping lat to x for legacy code compat temporarily
                    tp.lon as y_coord, -- Mapping lon to y
                    0 as area_pixels,
                    ph.health_score,
                    0.0 as growth_rate
                FROM palm_history ph
                JOIN tracked_palms tp ON ph.tracked_palm_id = tp.id
                WHERE ph.survey_id = {last_id}
             """
             df = pd.read_sql_query(query, conn)
             
    except Exception:
        df = pd.DataFrame()
    finally:
        conn.close()
    return df

def save_scan_results(total_palms, avg_health, palm_data):
    """
    Saves a new survey.
    Auto-Links found palms to 'tracked_palms' based on location.
    palm_data: List of dicts with keys: x, y, area, health_score
    """
    conn = get_connection()
    try:
        c = conn.cursor()
        scan_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. Insert Summary into surveys table
        c.execute("INSERT INTO surveys (scan_date, total_palms, avg_health) VALUES (?, ?, ?)",
                  (scan_date, total_palms, avg_health))
        survey_id = c.lastrowid
        
        # 2. Link Logic (Simple matching for now, assuming X/Y are stable-ish or dealing with static images)
        # Ideally X/Y should be converted to Lat/Lon before this function if real GPS.
        # For this stage, we assume X/Y ARE the unique location identifiers.
        
        THRESH = 20.0 # Pixel distance threshold to consider it the "same tree"
        
        for p in palm_data:
            x, y = p['x'], p['y']
            h_score = float(p['health_score'])
            
            # Find closest existing tracked palm
            c.execute("SELECT id, lat, lon FROM tracked_palms") 
            existing = c.fetchall()
            
            matched_id = None
            for pid, plat, plon in existing:
                dist = ((plat - x)**2 + (plon - y)**2)**0.5
                if dist < THRESH:
                    matched_id = pid
                    break
            
            if matched_id is None:
                # Register new palm
                c.execute("INSERT INTO tracked_palms (lat, lon, last_health_score, planted_date) VALUES (?, ?, ?, ?)",
                          (x, y, h_score, scan_date))
                matched_id = c.lastrowid
            else:
                # Update existing palm status
                c.execute("UPDATE tracked_palms SET last_health_score = ?, status = ? WHERE id = ?",
                          (h_score, 'Infected' if h_score < 40 else 'Healthy', matched_id))
            
            # Record History
            c.execute("""INSERT INTO palm_history 
                (tracked_palm_id, survey_id, health_score, yield_est) 
                VALUES (?, ?, ?, ?)""",
                (matched_id, survey_id, h_score, h_score * 0.5)) # Dummy yield calc for now
        
        # 3. Auto-Generate Tasks for Infected Palms
        c.execute("""
            INSERT INTO tasks (task_type, target_palm_id, priority, status, created_at)
            SELECT 'Pest Control', id, 'High', 'Pending', ?
            FROM tracked_palms
            WHERE last_health_score < 40
            AND id NOT IN (SELECT target_palm_id FROM tasks WHERE status != 'Done')
        """, (scan_date,))
            
        conn.commit()
        print(f"Saved Scan {survey_id}: {total_palms} palms processed.")
        return survey_id
        
    except Exception as e:
        print(f"Error saving to DB: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def get_financial_metrics():
    """Returns calculated P&L based on real config."""
    conn = get_connection()
    c = conn.cursor()
    
    # Get config
    c.execute("SELECT key, value FROM financial_config")
    config = dict(c.fetchall())
    
    oil_price = config.get('oil_price_per_ton', 800)
    
    # Get Yield Projections
    # Sum of latest yield_est for all active palms
    c.execute("""
        SELECT SUM(yield_est) FROM palm_history 
        WHERE survey_id = (SELECT MAX(id) FROM surveys)
    """)
    res = c.fetchone()
    total_yield = res[0] if res and res[0] else 0
    
    revenue = total_yield * oil_price
    
    conn.close()
    return {
        "revenue": revenue,
        "yield_tons": total_yield,
        "config": config
    }

