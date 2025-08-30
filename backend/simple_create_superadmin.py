#!/usr/bin/env python3
"""
Simple script to create a superadmin user for testing - no relationships
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import db_manager
import hashlib
from sqlalchemy import text

def create_superadmin():
    """Create a superadmin user using raw SQL"""
    # Initialize database
    db_manager.initialize_engine()
    
    with db_manager.get_session_context() as db:
        try:
            # Check if superadmin already exists
            result = db.execute(text("SELECT id FROM users WHERE username = 'superadmin'")).fetchone()
            if result:
                print("Superadmin user already exists")
                return
            
            # Create superadmin user with raw SQL
            password_hash = hashlib.sha256("admin123".encode()).hexdigest()
            
            db.execute(text("""
                INSERT INTO users (username, password_hash, role, contact, status, created_at, updated_at)
                VALUES (:username, :password_hash, :role, :contact, :status, NOW(), NOW())
            """), {
                "username": "superadmin",
                "password_hash": password_hash,
                "role": "superadmin",
                "contact": "1234567890",
                "status": "active"
            })
            
            print("Superadmin user created successfully!")
            print("Username: superadmin")
            print("Password: admin123")
            
        except Exception as e:
            print(f"Error creating superadmin: {e}")
            raise

if __name__ == "__main__":
    create_superadmin()