#!/usr/bin/env python3
"""
Check database structure and existing users
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import db_manager
from sqlalchemy import text

def check_database():
    """Check database structure"""
    # Initialize database
    db_manager.initialize_engine()
    
    with db_manager.get_session_context() as db:
        try:
            # Check existing users
            print("=== Existing Users ===")
            result = db.execute(text("SELECT id, username, role, shop_id FROM users LIMIT 10")).fetchall()
            for row in result:
                print(f"ID: {row[0]}, Username: {row[1]}, Role: {row[2]}, Shop ID: {row[3]}")
            
            # Check role constraint
            print("\n=== Role Constraint ===")
            result = db.execute(text("""
                SELECT conname, consrc 
                FROM pg_constraint 
                WHERE conrelid = 'users'::regclass AND conname LIKE '%role%'
            """)).fetchall()
            for row in result:
                print(f"Constraint: {row[0]}, Definition: {row[1]}")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_database()