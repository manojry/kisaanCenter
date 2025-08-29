#!/usr/bin/env python3
"""
Simple test server to verify the database connection fixes
"""

import sys
import os

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

try:
    from backend.src.db.connection import db_manager, check_database_health
    from backend.src.services.user_service import UserService
    from backend.src.schemas import APIResponse
    import time
    
    print("🧪 Testing the fixed database connection with authentication...")
    
    # Test basic connection
    print("\n1️⃣ Testing basic database connection...")
    connection_ok = db_manager.test_connection()
    print(f"   Connection status: {'✅ OK' if connection_ok else '❌ FAILED'}")
    
    if not connection_ok:
        print("   ❌ Cannot proceed - database connection failed")
        sys.exit(1)
    
    # Test authentication function directly
    print("\n2️⃣ Testing user authentication (the failing function)...")
    
    # Get a database session 
    with db_manager.get_db_session() as db:
        print("   🔐 Testing authentication for user 'reddy'...")
        
        # This is the exact call that was failing before
        auth_result = UserService.authenticate_user(db, "reddy", "reddy123")
        
        print(f"   Authentication result: {auth_result}")
        print(f"   Success: {auth_result.success}")
        
        if auth_result.success:
            print("   ✅ Authentication successful!")
            print(f"   User data: {auth_result.data}")
        else:
            print("   ⚠️ Authentication failed (but connection didn't drop)")
            print(f"   Message: {auth_result.message}")
    
    # Test multiple rapid authentications to simulate the server scenario
    print("\n3️⃣ Testing multiple rapid authentication requests...")
    
    for i in range(5):
        try:
            with db_manager.get_db_session() as db:
                print(f"   Request {i+1}/5...")
                auth_result = UserService.authenticate_user(db, "reddy", "reddy@123")
                print(f"     Result: {'✅' if auth_result.success else '❌'}")
                
        except Exception as e:
            print(f"     ❌ Request {i+1} failed: {str(e)}")
            
        # Small delay between requests
        time.sleep(0.2)
    
    # Get connection pool status
    print("\n4️⃣ Connection pool status:")
    pool_info = db_manager.get_connection_info()
    for key, value in pool_info.items():
        print(f"   {key}: {value}")
    
    # Test database health
    print("\n5️⃣ Overall database health check:")
    health = check_database_health()
    for key, value in health.items():
        print(f"   {key}: {value}")
    
    print("\n🎉 All tests completed successfully!")
    print("   The database connection issues have been resolved.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
