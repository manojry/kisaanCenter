#!/usr/bin/env python3
"""
Setup Super Admin Account
Creates a default super admin user with known credentials for initial access
"""

import sys
import os
import hashlib
from datetime import datetime

# Add the backend src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from db.connection import get_db_session
from models import Superadmin, RecordStatus

def create_super_admin():
    """Create default super admin account"""
    username = "superadmin"
    password = "admin123"  # Default password - should be changed after first login
    email = "admin@kisaancenter.com"
    contact = "+91-9876543210"
    
    # Hash the password using the same method as the authentication system
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        with get_db_session() as session:
            # Check if super admin already exists
            existing_admin = session.query(Superadmin).filter_by(username=username).first()
            
            if existing_admin:
                print(f"✅ Super admin '{username}' already exists")
                print(f"📧 Email: {existing_admin.email}")
                print(f"📱 Contact: {existing_admin.contact}")
                print(f"🔑 Use password: {password}")
                return True
            
            # Create new super admin
            super_admin = Superadmin(
                username=username,
                password_hash=password_hash,
                email=email,
                contact=contact,
                status=RecordStatus.ACTIVE,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(super_admin)
            session.commit()
            
            print("🎉 Super admin account created successfully!")
            print(f"👤 Username: {username}")
            print(f"🔑 Password: {password}")
            print(f"📧 Email: {email}")
            print(f"📱 Contact: {contact}")
            print("\n⚠️  IMPORTANT: Please change the default password after first login!")
            
            return True
            
    except Exception as e:
        print(f"❌ Error creating super admin: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Setting up Super Admin Account...")
    print("=" * 50)
    
    success = create_super_admin()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ Setup completed successfully!")
        print("\n🌐 You can now login to the application at:")
        print("   • Frontend: http://localhost:3000")
        print("   • API: http://localhost:8000")
        print("   • Docs: http://localhost:8000/docs")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)