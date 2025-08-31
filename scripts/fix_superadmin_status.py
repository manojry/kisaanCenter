#!/usr/bin/env python3
"""
Fix superadmin status enum value
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
    
    print(f"🔧 Fixing superadmin status enum value...")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    # Update the status value from 'active' to 'ACTIVE'
    cursor.execute("""
        UPDATE superadmin 
        SET status = 'ACTIVE'::recordstatus 
        WHERE username = 'kisaanCenter' AND status = 'active';
    """)
    
    rows_affected = cursor.rowcount
    print(f"✅ Updated {rows_affected} superadmin record(s)")
    
    # Commit the changes
    conn.commit()
    
    # Verify the fix
    cursor.execute("SELECT username, status FROM superadmin WHERE username = 'kisaanCenter';")
    result = cursor.fetchone()
    if result:
        username, status = result
        print(f"✅ Verified: {username} status is now '{status}'")
    
    # Close connections
    cursor.close()
    conn.close()
    """
    fix_superadmin_status.py

    Purpose: Fixes superadmin status in the database.
    Usage: python scripts/fix_superadmin_status.py
    Dependencies: requests, API server
    """
    print("🎉 Status enum fixed successfully!")
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
