#!/usr/bin/env python3
"""
Test script to verify models.py and seed_data.py are in sync with the database
"""

import sys
import os
sys.path.insert(0, '.')

def test_imports():
    """Test all imports"""
    print("Testing imports...")
    
    try:
        # Test models import
        from backend.src.models import (
            User, UserRole, Shop, Product, Category, Plan, 
            Transaction, TransactionType, TransactionStatus,
            FarmerStock, StockStatus, PaymentMethod, ExpenseCategory
        )
        print("✓ Models imported successfully")
        
        # Test database connection
        from backend.src.db.connection import get_db_session
        print("✓ Database connection imported successfully")
        
        # Test seed data
        from backend.src.db.seeds.seed_data import DatabaseSeeder, seed_database
        print("✓ Seed data imported successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_connection():
    """Test database connection"""
    print("\nTesting database connection...")
    
    try:
        from backend.src.db.connection import get_db_session
        
        with get_db_session() as session:
            result = session.execute("SELECT 1")
            print("✓ Database connection successful")
            return True
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_model_structure():
    """Test model structure matches expectations"""
    print("\nTesting model structure...")
    
    try:
        from backend.src.models import User, UserRole, Shop
        
        # Test enum values
        roles = [role.value for role in UserRole]
        expected_roles = ['SUPERADMIN', 'OWNER', 'EMPLOYEE', 'FARMER', 'BUYER']
        
        for role in expected_roles:
            if role not in roles:
                print(f"✗ Missing role: {role}")
                return False
        
        print("✓ UserRole enum is correct")
        
        # Test table names (should be plural)
        assert User.__tablename__ == 'users'
        assert Shop.__tablename__ == 'shops'
        print("✓ Table names are correct (plural)")
        
        return True
        
    except Exception as e:
        print(f"✗ Model structure test failed: {e}")
        return False

def test_seeder_initialization():
    """Test seeder can be initialized"""
    print("\nTesting seeder initialization...")
    
    try:
        from backend.src.db.seeds.seed_data import DatabaseSeeder
        
        seeder = DatabaseSeeder()
        print("✓ DatabaseSeeder initialized successfully")
        
        # Test database verification
        if seeder.verify_database_connection():
            print("✓ Database verification successful")
        else:
            print("✗ Database verification failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Seeder initialization failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("KISAAN CENTER - DATABASE SYNC TEST")
    print("=" * 60)
    
    tests = [
        ("Import Test", test_imports),
        ("Database Connection", test_database_connection),
        ("Model Structure", test_model_structure),
        ("Seeder Initialization", test_seeder_initialization),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {test_name}: {status}")
        if not result:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED - Models and seed data are in sync!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Please fix the issues above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
