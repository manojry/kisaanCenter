#!/usr/bin/env python3
"""
Check users in database
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.src.database import get_db
from sqlalchemy import text

def check_users():
    """Check users in database"""
    db = next(get_db())
    
    try:
        # Get users
        result = db.execute(text("SELECT id, username, role, shop_id FROM users WHERE role = 'owner'"))
        users = result.fetchall()
        
        print("Owner users in database:")
        for user in users:
            print(f"ID: {user[0]}, Username: {user[1]}, Role: {user[2]}, Shop ID: {user[3]}")
            
        # Check password hashing
        result = db.execute(text("SELECT username, password_hash FROM users WHERE username = 'reddy'"))
        user = result.fetchone()
        if user:
            print(f"\nUser 'reddy' found:")
            print(f"Username: {user[0]}")
            print(f"Password hash: {user[1][:20]}...")
        else:
            print("User 'reddy' not found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
