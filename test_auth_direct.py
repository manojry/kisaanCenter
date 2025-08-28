#!/usr/bin/env python3
"""
Direct test of authentication logic without FastAPI server
"""
import hashlib
from datetime import datetime
import sys
import os

# Add backend/src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from services.user_service import UserService
from database.connection import SessionLocal

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def test_authentication():
    print("🔧 Testing authentication logic directly...")
    
    # Test password hashing
    test_password = "Kissan@2025!"
    expected_hash = hash_password(test_password)
    print(f"📝 Password: {test_password}")
    print(f"🔐 Expected hash: {expected_hash}")
    
    # Test authentication
    try:
        db = SessionLocal()
        result = UserService.authenticate_user(
            db=db,
            username="kisaanCenter",
            password=test_password
        )
        
        if result:
            print(f"✅ Authentication SUCCESSFUL!")
            print(f"🎉 User: {result.get('username', 'N/A')}")
            print(f"🆔 ID: {result.get('id', 'N/A')}")
            print(f"📧 Email: {result.get('email', 'N/A')}")
            return True
        else:
            print(f"❌ Authentication FAILED - returned None")
            return False
            
    except Exception as e:
        print(f"❌ Authentication ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    success = test_authentication()
    if success:
        print("\n🎉 SUCCESS: Superadmin authentication is working!")
        print("✅ Password hash is correct")
        print("✅ Database connection is working") 
        print("✅ Authentication logic is functioning")
        print("\n🚀 You can now use the login with:")
        print("   Username: kisaanCenter")
        print("   Password: Kissan@2025!")
    else:
        print("\n❌ FAILED: Authentication test failed")
    exit(0 if success else 1)
