#!/usr/bin/env python3
"""
Simple direct test of role field fix without API server
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import hashlib

# Database connection
DATABASE_URL = "postgresql://postgres:yd2A4TKG1d7J@manoj-test.dev.ea.mpi-internal.com:5432/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_role_field_fix():
    """Test that we can create and read user with string role values"""
    db = SessionLocal()
    
    try:
        print("🔄 Testing role field fix...")
        
        # Test 1: Create a test user with owner role
        print("  1. Creating test user with 'owner' role...")
        
        password_hash = hashlib.sha256("testpassword123".encode()).hexdigest()
        
        # Insert directly via SQL to test the database layer
        insert_sql = text("""
            INSERT INTO "user" (username, password_hash, role, status, shop_id, contact, credit_limit)
            VALUES (:username, :password_hash, :role, :status, :shop_id, :contact, :credit_limit)
            RETURNING id
        """)
        
        result = db.execute(insert_sql, {
            "username": "test_owner_role",
            "password_hash": password_hash,
            "role": "owner",
            "status": "active", 
            "shop_id": 1,
            "contact": "1234567890",
            "credit_limit": 0.0
        })
        
        user_id = result.fetchone()[0]
        db.commit()
        print(f"  ✅ User created successfully with ID: {user_id}")
        
        # Test 2: Read the user back and verify role is read correctly
        print("  2. Reading user back from database...")
        
        select_sql = text("""
            SELECT id, username, role, status FROM "user" 
            WHERE username = :username
        """)
        
        result = db.execute(select_sql, {"username": "test_owner_role"})
        user_row = result.fetchone()
        
        if user_row:
            user_id, username, role, status = user_row
            print(f"  ✅ User read successfully:")
            print(f"     ID: {user_id}")
            print(f"     Username: {username}")
            print(f"     Role: {role} (type: {type(role).__name__})")
            print(f"     Status: {status} (type: {type(status).__name__})")
            
            # Verify role is a string and has correct value
            if isinstance(role, str) and role == "owner":
                print("  ✅ Role field is correctly stored and retrieved as string")
            else:
                print(f"  ❌ Role field issue - Expected 'owner' string, got {role} ({type(role)})")
                return False
                
        else:
            print("  ❌ Failed to read user back")
            return False
        
        # Test 3: Test role filtering (used in authentication)
        print("  3. Testing role-based filtering...")
        
        filter_sql = text("""
            SELECT COUNT(*) FROM "user" 
            WHERE role = :role
        """)
        
        result = db.execute(filter_sql, {"role": "owner"})
        count = result.fetchone()[0]
        print(f"  ✅ Found {count} users with 'owner' role")
        
        # Cleanup
        print("  4. Cleaning up test data...")
        delete_sql = text("""DELETE FROM "user" WHERE username = :username""")
        db.execute(delete_sql, {"username": "test_owner_role"})
        db.commit()
        print("  ✅ Test data cleaned up")
        
        print("🎉 All tests passed! Role field fix is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = test_role_field_fix()
    sys.exit(0 if success else 1)
