#!/usr/bin/env python3
"""Simple PostgreSQL connection test"""

import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get connection details
host = os.getenv("DB_HOST", "localhost")
port = os.getenv("DB_PORT", "5432")
database = os.getenv("DB_NAME", "postgres")
user = os.getenv("DB_USER", "postgres")
password = os.getenv("DB_PASSWORD", "")

print(f"Attempting to connect to:")
print(f"  Host: {host}")
print(f"  Port: {port}")
print(f"  Database: {database}")
print(f"  User: {user}")
print(f"  Password: {'*' * len(password) if password else '(empty)'}")

try:
    # Try without SSL first
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    print("✅ Connection successful (no SSL)!")
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Connection failed (no SSL): {e}")
    
    # Try with SSL
    try:
        print("\nTrying with SSL required...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='require'
        )
        print("✅ Connection successful (SSL required)!")
        conn.close()
        
    except psycopg2.OperationalError as ssl_e:
        print(f"❌ Connection failed (SSL required): {ssl_e}")
        
        # Try with SSL prefer
        try:
            print("\nTrying with SSL prefer...")
            conn = psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                sslmode='prefer'
            )
            print("✅ Connection successful (SSL prefer)!")
            conn.close()
            
        except psycopg2.OperationalError as pref_e:
            print(f"❌ All connection attempts failed.")
            print(f"Last error: {pref_e}")
            print("\n🔍 This might mean:")
            print("  - Incorrect password")
            print("  - Server doesn't allow connections from your IP")
            print("  - Network/firewall issues")
            print("  - Server is down")
