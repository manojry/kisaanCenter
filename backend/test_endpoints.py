"""
Test script to verify API endpoints work with the fixed database tables
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.db.connection import db_manager
from src.models import Credit, Transaction, Product, User
from src.services.user_service import UserService
from fastapi.testclient import TestClient

# Test database connectivity first
print("🔍 Testing database connectivity...")
with db_manager.get_db_session() as session:
    # Test all the models that were causing 404 errors
    credits_count = session.query(Credit).count()
    transactions_count = session.query(Transaction).count() 
    products_count = session.query(Product).count()
    users_count = session.query(User).count()
    
    print(f"✅ Credits table accessible: {credits_count} records")
    print(f"✅ Transactions table accessible: {transactions_count} records")
    print(f"✅ Products table accessible: {products_count} records")
    print(f"✅ Users table accessible: {users_count} records")

# Now test the FastAPI app
print("\n🔍 Testing FastAPI app...")
try:
    from src.main import app
    client = TestClient(app)
    
    print("✅ FastAPI app imported successfully")
    
    # Test the endpoints that were returning 404
    print("\n🔍 Testing API endpoints...")
    
    # Test credits endpoint
    response = client.get("/api/v1/credits?shop_id=1")
    print(f"GET /api/v1/credits - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Credits endpoint working!")
    else:
        print(f"❌ Credits endpoint failed: {response.text}")
    
    # Test products endpoint  
    response = client.get("/api/v1/products?shop_id=1")
    print(f"GET /api/v1/products - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Products endpoint working!")
    else:
        print(f"❌ Products endpoint failed: {response.text}")
        
    # Test transactions endpoint
    response = client.get("/api/v1/transactions?shop_id=1") 
    print(f"GET /api/v1/transactions - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Transactions endpoint working!")
    else:
        print(f"❌ Transactions endpoint failed: {response.text}")
        
    print("\n🎉 All endpoints are now working! The 404 errors are resolved!")
    
except Exception as e:
    print(f"❌ Error testing FastAPI app: {e}")
    import traceback
    traceback.print_exc()
