#!/usr/bin/env python3
"""
Direct database connection test using psycopg2
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

print("🔗 Testing PostgreSQL Connection...")
print(f"Host: {DB_HOST}")
print(f"Port: {DB_PORT}")
print(f"Database: {DB_NAME}")
print(f"User: {DB_USER}")
print(f"Password: {'*' * len(DB_PASSWORD) if DB_PASSWORD else 'EMPTY'}")

try:
    # Create connection string
    conn_string = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} sslmode=require"
    
    print(f"\n🚀 Connecting to database...")
    conn = psycopg2.connect(conn_string)
    
    # Create cursor
    cursor = conn.cursor()
    
    # Test query
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✅ Connected successfully!")
    print(f"PostgreSQL version: {version[0]}")
    
    # Check if superadmin table exists
    cursor.execute("""
        SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE  table_schema = 'public'
           AND    table_name   = 'superadmin'
        );
    """)
    table_exists = cursor.fetchone()[0]
    print(f"Superadmin table exists: {table_exists}")
    
    if table_exists:
        cursor.execute("SELECT username, password FROM superadmin;")
        superadmins = cursor.fetchall()
        print(f"Found {len(superadmins)} superadmin records:")
        for username, password in superadmins:
            print(f"  - {username}: {password[:10]}...")
    
    # Close connections
    cursor.close()
    conn.close()
    print("🎉 Connection test successful!")
    
except psycopg2.Error as e:
    print(f"❌ Database connection failed: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
