#!/usr/bin/env python3
"""
Check enum values for recordstatus
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
    
    print(f"🔍 Checking recordstatus enum values...")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    # Get enum values for recordstatus
    cursor.execute("""
        SELECT enumlabel 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'recordstatus'
        ORDER BY e.enumsortorder;
    """)
    
    enum_values = cursor.fetchall()
    print(f"📊 Available enum values for 'recordstatus':")
    for (value,) in enum_values:
        print(f"  - '{value}'")
    
    # Check current superadmin status
    cursor.execute("SELECT username, status::text FROM superadmin WHERE username = 'kisaanCenter';")
    result = cursor.fetchone()
    if result:
        username, status = result
        print(f"\n📋 Current status for {username}: '{status}'")
    
    # Close connections
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
