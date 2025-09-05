#!/usr/bin/env python3
"""
Create test users and products for transaction testing
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def create_test_data():
    print("🔧 CREATING TEST DATA FOR TRANSACTIONS")
    print("=" * 50)
    
    # Login as owner
    print("🔐 Login as owner")
    login_data = {"username": "reddy", "password": "reddy@123"}
    login_response = requests.post(f"{BASE_URL}/api/v1/users/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return False
        
    auth_data = login_response.json()["data"]
    token = auth_data["access_token"]
    shop_id = auth_data["shop_id"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"✅ Authenticated as owner (Shop ID: {shop_id})")
    
    # Create test users
    print("\n👥 Creating test users")
    test_users = [
        {"username": "test_farmer1", "password": "password123", "role": "farmer", "full_name": "Test Farmer 1", "email": "farmer1@test.com"},
        {"username": "test_buyer1", "password": "password123", "role": "buyer", "full_name": "Test Buyer 1", "email": "buyer1@test.com", "credit_limit": 10000},
        {"username": "test_employee1", "password": "password123", "role": "employee", "full_name": "Test Employee 1", "email": "employee1@test.com"}
    ]
    
    created_users = []
    for user_data in test_users:
        user_data["shop_id"] = shop_id
        create_response = requests.post(f"{BASE_URL}/api/v1/owner-admin/shops/{shop_id}/users", headers=headers, json=user_data)
        print(f"Creating {user_data['role']} {user_data['username']}: {create_response.status_code}")
        if create_response.status_code in [200, 201]:
            created_users.append(user_data)
            print(f"✅ Created {user_data['username']}")
        else:
            print(f"❌ Failed to create {user_data['username']}: {create_response.text}")
    
    # Create test products
    print("\n📦 Creating test products")
    test_products = [
        {"name": "Tomatoes", "category": "Vegetables", "price": 50.0, "unit": "kg"},
        {"name": "Potatoes", "category": "Vegetables", "price": 30.0, "unit": "kg"},
        {"name": "Onions", "category": "Vegetables", "price": 40.0, "unit": "kg"},
        {"name": "Rice", "category": "Grains", "price": 80.0, "unit": "kg"},
        {"name": "Wheat", "category": "Grains", "price": 60.0, "unit": "kg"}
    ]
    
    created_products = []
    for product_data in test_products:
        create_response = requests.post(f"{BASE_URL}/api/v1/products", headers=headers, json=product_data)
        print(f"Creating product {product_data['name']}: {create_response.status_code}")
        if create_response.status_code in [200, 201]:
            created_products.append(product_data)
            print(f"✅ Created {product_data['name']}")
        else:
            print(f"❌ Failed to create {product_data['name']}: {create_response.text}")
    
    print(f"\n✅ Test data creation completed!")
    print(f"   Created {len(created_users)} users")
    print(f"   Created {len(created_products)} products")
    
    return True

if __name__ == "__main__":
    try:
        create_test_data()
    except Exception as e:
        print(f"❌ Failed to create test data: {e}")
        import traceback
        traceback.print_exc()
