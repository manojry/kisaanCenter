#!/usr/bin/env python3
"""
Simple script to create a superadmin user for testing
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import db_manager
from src.models import User
from src.models.enums import RecordStatus, UserRole
import hashlib

def create_superadmin():
    """Create a superadmin user"""
    # Initialize database
    db_manager.initialize_engine()
    db = db_manager.get_session()
    try:
        # Check if superadmin already exists
        existing_superadmin = db.query(User).filter(User.username == "superadmin").first()
        if existing_superadmin:
            print("Superadmin user already exists")
            return
        
        # Create superadmin user
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        superadmin = User(
            username="superadmin",
            password_hash=password_hash,
            role="superadmin",
            contact="1234567890",
            status="active"
        )
        
        db.add(superadmin)
        db.commit()
        print("Superadmin user created successfully!")
        print("Username: superadmin")
        print("Password: admin123")
        
    except Exception as e:
        print(f"Error creating superadmin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin()