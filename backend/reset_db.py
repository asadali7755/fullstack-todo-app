import sqlite3
import os
from pathlib import Path

def reset_database():
    # Database file paths
    db_paths = [
        "todo_app.db",
        "todo_app_local.db"
    ]
    
    for db_path in db_paths:
        if os.path.exists(db_path):
            print(f"Removing existing database: {db_path}")
            os.remove(db_path)
        else:
            print(f"Database {db_path} not found, skipping...")
    
    print("Database reset complete!")
    print("Starting initialization...")
    
    # Import and run the init script
    try:
        from init_db import init_database
        init_database()
        print("Database initialized successfully!")
    except ImportError:
        print("Could not import init_db, trying init_db_fixed...")
        try:
            from init_db_fixed import init_database
            init_database()
            print("Database initialized successfully!")
        except ImportError:
            print("Could not find initialization script")
            print("Running init_db.py directly...")
            os.system("python init_db.py")

if __name__ == "__main__":
    reset_database()