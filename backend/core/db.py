import sqlite3
import pandas as pd
import os
from datetime import datetime

# Cloud-Friendly Configuration
# Uses environment variable if set (for Cloud), otherwise defaults to local relative path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # points to backend/
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "farm_data.db")

DB_FILE = os.getenv("DB_PATH", DEFAULT_DB_PATH)

def get_connection():
    if not os.path.exists(DB_FILE):
        print(f"⚠️ Warning: Database file not found at {DB_FILE}")
    return sqlite3.connect(DB_FILE)

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

def get_latest_palms_df():
    conn = get_connection()
    try:
        c = conn.cursor()
        c.execute("SELECT MAX(id) FROM surveys")
        res = c.fetchone()
        last_id = res[0] if res else None
        
        if last_id is None:
            return pd.DataFrame()
            
        df = pd.read_sql_query(f"SELECT * FROM palms WHERE survey_id = {last_id}", conn)
    except Exception:
        df = pd.DataFrame()
    finally:
        conn.close()
    return df

def save_scan_results(total_palms, avg_health, palm_data):
    """
    Saves a new survey and its associated palm details to the database.
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
        
        # 2. Insert Details into palms table
        palms_to_insert = []
        for i, p in enumerate(palm_data):
            # Schema: survey_id, palm_id_track, x_coord, y_coord, area_pixels, health_score, growth_rate
            # We use index 'i' as palm_id_track for this session since we don't have tracking logic yet
            palms_to_insert.append((
                survey_id, 
                i + 1, 
                int(p['x']), 
                int(p['y']), 
                int(p['area']), 
                float(p['health_score']), 
                0.0 # growth_rate default
            ))
            
        c.executemany("INSERT INTO palms (survey_id, palm_id_track, x_coord, y_coord, area_pixels, health_score, growth_rate) VALUES (?, ?, ?, ?, ?, ?, ?)", palms_to_insert)
        
        conn.commit()
        print(f"Saved Scan {survey_id}: {total_palms} palms")
        return survey_id
        
    except Exception as e:
        print(f"Error saving to DB: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()
