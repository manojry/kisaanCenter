#!/usr/bin/env python3
"""
Script to fix the superadmin password hash in the database
"""
"""
fix_superadmin_password.py

Purpose: Resets superadmin password via API call.
Usage: python scripts/fix_superadmin_password.py
Dependencies: requests, API server
"""
import hashlib
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Validate required environment variables
required_vars = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    print(f"❌ Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please set these in your .env file or environment")
    exit(1)

def get_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT', 5432)),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        sslmode=os.getenv('DB_SSL_MODE', 'require')
    )

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def main():
    print("🔧 Fixing superadmin password hash...")
    
    password = "Kissan@2025!"
    correct_hash = hash_password(password)
    
    print(f"📝 Password: {password}")
    print(f"🔐 Correct hash: {correct_hash}")
    
    # Get current hash
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT password_hash FROM superadmin WHERE username = 'kisaanCenter';")
    current_hash = cursor.fetchone()[0]
    print(f"❌ Current hash: {current_hash}")
    
    if current_hash == correct_hash:
        print("✅ Password hash is already correct!")
        return
    
    # Update the password hash
    cursor.execute(
        "UPDATE superadmin SET password_hash = %s WHERE username = 'kisaanCenter';",
        (correct_hash,)
    )
    conn.commit()
    
    print("✅ Password hash updated successfully!")
    
    # Verify the update
    cursor.execute("SELECT password_hash FROM superadmin WHERE username = 'kisaanCenter';")
    new_hash = cursor.fetchone()[0]
    print(f"✅ New hash: {new_hash}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
