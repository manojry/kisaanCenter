#!/usr/bin/env python3
"""Test script to check import issues"""

try:
    print("Testing schema imports...")
    from src.schemas import UserCreate, UserUpdate, UserRead, UserReadWithRelations
    print("✅ User schemas imported successfully")
    
    from src.schemas import ShopCreate, ShopUpdate, ShopRead
    print("✅ Shop schemas imported successfully")
    
    from src.schemas import APIResponse, PaginationParams, BaseSchema, TimestampMixin
    print("✅ Base schemas imported successfully")
    
    print("\nTesting API module imports...")
    from src.api import users
    print("✅ Users API imported successfully")
    
    from src.api import shops
    print("✅ Shops API imported successfully")
    
    from src.api import plans
    print("✅ Plans API imported successfully")
    
    print("\nTesting main app import...")
    from src.main import app
    print("✅ Main app imported successfully")
    
    print("\n🎉 All imports successful!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"❌ Other error: {e}")
    import traceback
    traceback.print_exc()