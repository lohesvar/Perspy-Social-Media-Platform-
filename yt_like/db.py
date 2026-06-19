import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    print("Initializing SQLite database...")
    conn = get_db_connection()
    
    # Read and execute schema.sql
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()
    
    conn.executescript(schema_sql)
    conn.commit()
    print("Database schema loaded successfully.")

    # Seed initial data if database is empty - disabled for a clean, new website
    conn.close()

if __name__ == "__main__":
    init_db()


