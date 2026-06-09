import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'mechconnect.db')
if not os.path.exists(DB_PATH):
    print("Database file does not exist.")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cur.fetchall()
print("Tables:", [t[0] for t in tables])

for table, in tables:
    cur.execute(f"PRAGMA table_info({table})")
    cols = cur.fetchall()
    print(f"\n--- {table} ---")
    for col in cols:
        print(col[1], col[2])
conn.close()
