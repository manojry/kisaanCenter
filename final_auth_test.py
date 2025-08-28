#!/usr/bin/env python3
"""
Simple test to verify authentication works by checking the database directly
"""
import hashlib
import psycopg2
import os
from dotenv import load_dotenv

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

def test_final_authentication():
    print("🔧 Final authentication test...")
    
    username = "kisaanCenter"
    password = "Kissan@2025!"
    password_hash = hash_password(password)
    
    print(f"📝 Testing credentials:")
    print(f"   Username: {username}")
    print(f"   Password: {password}")
    print(f"   Expected hash: {password_hash}")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check what's actually in the database
        query = """
        SELECT username, password_hash, email, status 
        FROM superadmin 
        WHERE username = %s
        """
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        
        if not result:
            print("❌ No superadmin found with that username")
            return False
        
        db_username, db_password_hash, db_email, db_status = result
        print(f"🔍 Found superadmin:")
        print(f"   Username: {db_username}")
        print(f"   Email: {db_email}")
        print(f"   Status: {db_status}")
        print(f"   Stored hash: {db_password_hash[:50]}...")
        
        # Test password hash comparison
        if db_password_hash == password_hash:
            print("✅ PASSWORD HASH MATCHES!")
            print("🎉 Authentication would be SUCCESSFUL!")
            
            # Verify status is active
            if db_status == 'active':
                print("✅ Status is active")
                return True
            else:
                print(f"⚠️ Status is '{db_status}' instead of 'active'")
                return False
        else:
            print("❌ PASSWORD HASH MISMATCH!")
            print(f"   Expected: {password_hash}")
            print(f"   Got:      {db_password_hash}")
            return False
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 FINAL AUTHENTICATION TEST")
    print("=" * 50)
    
    success = test_final_authentication()
    
    print("=" * 50)
    if success:
        print("🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉")
        print("✅ Database connection: WORKING")
        print("✅ Password hash: CORRECT")
        print("✅ Superadmin record: FOUND")
        print("✅ Authentication: WILL WORK")
        print()
        print("🚀 Your superadmin login credentials:")
        print(f"   👤 Username: kisaanCenter")
        print(f"   🔐 Password: Kissan@2025!")
        print()
        print("🌟 You can now log into your application!")
    else:
        print("❌ ❌ ❌ FAILED ❌ ❌ ❌")
        print("Something is still not working correctly.")
    
    exit(0 if success else 1)
