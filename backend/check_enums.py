#!/usr/bin/env python3

import psycopg2
from src.db.connection import DatabaseConfig

def check_existing_enums():
    try:
        config = DatabaseConfig()
        
        # Create direct psycopg2 connection for raw SQL
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            sslmode=config.DB_SSL_MODE
        )
        cursor = conn.cursor()
        
        # Check existing enum types
        cursor.execute("SELECT typname FROM pg_type WHERE typtype='e'")
        types = cursor.fetchall()
        print('Existing enum types:', [t[0] for t in types])
        
        # Check existing tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        print('Existing tables:', [t[0] for t in tables])
        
        # Check alembic version
        try:
            cursor.execute("SELECT version_num FROM alembic_version")
            version = cursor.fetchone()
            print('Current alembic version:', version[0] if version else 'None')
        except Exception as e:
            print('No alembic_version table found:', e)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_existing_enums()
