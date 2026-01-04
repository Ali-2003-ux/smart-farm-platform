
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "data", "farm_data.db")

if not os.path.exists(DB_FILE):
    print(f"DB not found at {DB_FILE}")
else:
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT sql FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    for table in tables:
        print(table[0])
    conn.close()
