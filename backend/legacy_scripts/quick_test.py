#!/usr/bin/env python3
"""
Quick test for the fixed API endpoints
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_endpoints():
    print("🔍 Testing database connectivity...")
    
    # Test database first
    try:
        from src.db.connection import db_manager
        from src.models import Credit, Transaction, Product
        
        with db_manager.get_db_session() as session:
            credits_count = session.query(Credit).count()
            transactions_count = session.query(Transaction).count()
            products_count = session.query(Product).count()
            
            print(f"✅ Database accessible:")
            print(f"   - Credits: {credits_count} records")
            print(f"   - Transactions: {transactions_count} records") 
            print(f"   - Products: {products_count} records")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        return
    
    print("\n🔍 Testing FastAPI app...")
    
    try:
        from src.main import app
        print("✅ FastAPI app imported successfully")
        
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        print("\n🔍 Testing API endpoints...")
        
        # Test the three endpoints that were failing
        endpoints_to_test = [
            "/api/v1/credits?shop_id=1",
            "/api/v1/products?shop_id=1", 
            "/api/v1/transactions?shop_id=1"
        ]
        
        results = []
        for endpoint in endpoints_to_test:
            try:
                response = client.get(endpoint)
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} {endpoint} - Status: {response.status_code}")
                results.append(response.status_code == 200)
                
                if response.status_code != 200:
                    print(f"   Error: {response.text[:100]}")
                
            except Exception as e:
                print(f"❌ {endpoint} - Error: {e}")
                results.append(False)
        
        if all(results):
            print(f"\n🎉 SUCCESS! All endpoints are now working!")
            print(f"✅ The 404 errors have been resolved!")
        else:
            print(f"\n⚠️  Some endpoints still have issues")
            
    except Exception as e:
        print(f"❌ FastAPI error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_endpoints()
