#!/usr/bin/env python3
"""
Simple AWS RDS Connection Test
"""

import os
from dotenv import load_dotenv
import psycopg2

print("🌾 AWS RDS Connection Test")
print("=" * 40)

# Load environment variables
load_dotenv()
print("✅ Loaded .env file")

# Get credentials
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT", "5432")
database = os.getenv("DB_NAME", "postgres")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

print(f"🏠 Host: {host}")
print(f"🔌 Port: {port}")
print(f"🗃️  Database: {database}")
print(f"👤 User: {username}")
print("-" * 40)

if not all([host, username, password]):
    print("❌ Missing required credentials in .env file!")
    exit(1)

try:
    print("🔄 Attempting connection...")
    connection = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=username,
        password=password,
        sslmode='prefer',
        connect_timeout=30
    )
    
    print("✅ Connection successful!")
    
    cursor = connection.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"📊 PostgreSQL Version: {version[0][:50]}...")
    
    cursor.execute("SELECT current_database();")
    current_db = cursor.fetchone()
    print(f"🗃️  Current Database: {current_db[0]}")
    
    cursor.close()
    connection.close()
    
    print("🎉 AWS RDS connection is working perfectly!")
    
except psycopg2.Error as e:
    print(f"❌ PostgreSQL Error: {e}")
except Exception as e:
    print(f"❌ Connection Error: {e}")
