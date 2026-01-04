import sqlite3
import pandas as pd
import os

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
