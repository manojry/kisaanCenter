#!/usr/bin/env python3
"""
Debug login issue
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.src.database import get_db
from sqlalchemy import text
import hashlib

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def debug_login():
    """Debug login issue"""
    db = next(get_db())
    
    try:
        username = "reddy"
        password = "reddy@123"
        password_hash = hash_password(password)
        
        print(f"Testing login for username: {username}")
        print(f"Password: {password}")
        print(f"Password hash: {password_hash}")
        
        # Check exact query from login endpoint
        result = db.execute(text("""
            SELECT id, username, role, shop_id, password_hash, record_status FROM users 
            WHERE username = :username AND password_hash = :password_hash AND record_status = 'active'
        """), {"username": username, "password_hash": password_hash})
        
        user = result.fetchone()
        if user:
            print(f"✅ User found:")
            print(f"   ID: {user[0]}")
            print(f"   Username: {user[1]}")
            print(f"   Role: {user[2]}")
            print(f"   Shop ID: {user[3]}")
            print(f"   Password Hash: {user[4]}")
            print(f"   Record Status: {user[5]}")
        else:
            print("❌ User not found with exact query")
            
            # Check what's actually in the database
            print("\n🔍 Checking what's actually in database...")
            result = db.execute(text("""
                SELECT id, username, role, shop_id, password_hash, record_status FROM users 
                WHERE username = :username
            """), {"username": username})
            
            users = result.fetchall()
            for user in users:
                print(f"User found: ID={user[0]}, Username={user[1]}, Role={user[2]}, Shop_ID={user[3]}")
                print(f"   Password Hash: {user[4]}")
                print(f"   Record Status: '{user[5]}'")
                print(f"   Hash matches: {user[4] == password_hash}")
                print(f"   Status is active: {user[5] == 'active'}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_login()
