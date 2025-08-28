#!/usr/bin/env python3
"""
Check superadmin table structure
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database credentials
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Validate required environment variables
required_vars = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    print(f"❌ Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please set these in your .env file or environment")
    exit(1)

try:
    # Create connection string
    conn_string = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} sslmode=require"
    
    print(f"🔍 Checking superadmin table structure...")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    # Get table structure
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'superadmin'
        ORDER BY ordinal_position;
    """)
    
    columns = cursor.fetchall()
    print(f"📊 Superadmin table columns:")
    for col_name, data_type, nullable in columns:
        print(f"  - {col_name}: {data_type} ({'nullable' if nullable == 'YES' else 'not null'})")
    
    # Get all data from superadmin table
    cursor.execute("SELECT * FROM superadmin;")
    rows = cursor.fetchall()
    
    print(f"\n📋 Superadmin table data ({len(rows)} rows):")
    if rows:
        col_names = [desc[0] for desc in cursor.description]
        print(f"Columns: {col_names}")
        for row in rows:
            print(f"  Row: {dict(zip(col_names, row))}")
    else:
        print("  No data found")
    
    # Close connections
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
