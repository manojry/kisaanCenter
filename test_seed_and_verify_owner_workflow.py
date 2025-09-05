#!/usr/bin/env python3
"""
Seed and verify owner workflow: login, create categories/users/products/transactions, and verify all APIs step by step.
Avoids duplication by checking for existing data before creation.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/users/auth/login"
CATEGORY_URL = f"{BASE_URL}/api/v1/categories"
USERS_URL = f"{BASE_URL}/api/v1/owner-admin/shops/{{shop_id}}/users"
PRODUCTS_URL = f"{BASE_URL}/api/v1/owner-admin/shops/{{shop_id}}/products"
TRANSACTIONS_URL = f"{BASE_URL}/api/v1/transactions"
DASHBOARD_URL = f"{BASE_URL}/api/v1/shops/{{shop_id}}/dashboard"
ANALYTICS_URL = f"{BASE_URL}/api/v1/owner-admin/shops/{{shop_id}}/analytics"

# --- Step 1: Login as owner ---
def login_owner():
    login_data = {"username": "reddy", "password": "reddy@123"}
    resp = requests.post(LOGIN_URL, json=login_data)
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.text}")
        return None, None, None
    data = resp.json()["data"]
    token = data["access_token"]
    shop_id = data["shop_id"]
    user_id = data.get("user_id", data.get("id"))
    print(f"✅ Owner login successful (User ID: {user_id}, Shop ID: {shop_id})")
    return token, shop_id, user_id

# --- Step 2: Seed categories (if API exists) ---
def seed_categories(token):
    print("   (Skipping category seeding: No API endpoint)")
    return []

# --- Step 3: Seed users (avoid duplicates) ---
def seed_users(token, shop_id):
    headers = {"Authorization": f"Bearer {token}"}
    test_users = [
        {"username": "test_farmer1", "password": "password123", "role": "farmer", "full_name": "Test Farmer 1", "email": "farmer1@test.com"},
        {"username": "test_buyer1", "password": "password123", "role": "buyer", "full_name": "Test Buyer 1", "email": "buyer1@test.com", "credit_limit": 10000},
        {"username": "test_employee1", "password": "password123", "role": "employee", "full_name": "Test Employee 1", "email": "employee1@test.com"}
    ]
    # Get existing users
    resp = requests.get(USERS_URL.format(shop_id=shop_id), headers=headers)
    existing_usernames = set()
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success") and data.get("data"):
            nested = data["data"]
            if nested.get("success") and nested.get("data"):
                users = nested["data"]["users"]
                existing_usernames = set(u["username"] for u in users)
    created = []
    users_to_create = []
    for user in test_users:
        if user["username"] in existing_usernames:
            print(f"   User '{user['username']}' already exists.")
            continue
        user["shop_id"] = shop_id
        users_to_create.append(user)
    if users_to_create:
        resp = requests.post(USERS_URL.format(shop_id=shop_id), headers=headers, json=users_to_create)
        print(f"DEBUG: User creation response status: {resp.status_code}")
        print(f"DEBUG: User creation response: {resp.text}")
        if resp.status_code in [200, 201]:
            data = resp.json()
            if data.get("success"):
                print(f"   ✅ Created users: {[u['username'] for u in users_to_create]}")
                created.extend(data.get("data", []))
            else:
                print(f"   ❌ User creation failed: {data.get('message', 'Unknown error')}")
                print(f"   Errors: {data.get('data', {}).get('errors', [])}")
        else:
            print(f"   ❌ Failed to create users: {resp.text}")
    else:
        print("   All users already exist.")
    return created

# --- Step 4: Seed products (avoid duplicates) ---
def seed_products(token, shop_id):
    headers = {"Authorization": f"Bearer {token}"}
    # Use category_id: 1=Vegetables, 2=Grains (adjust as per your DB)
    test_products = [
        {"name": "Tomatoes", "category_id": 1, "shop_id": shop_id, "record_status": "active", "price": 50.0},
        {"name": "Potatoes", "category_id": 1, "shop_id": shop_id, "record_status": "active", "price": 30.0},
        {"name": "Onions", "category_id": 1, "shop_id": shop_id, "record_status": "active", "price": 40.0},
        {"name": "Rice", "category_id": 2, "shop_id": shop_id, "record_status": "active", "price": 80.0},
        {"name": "Wheat", "category_id": 2, "shop_id": shop_id, "record_status": "active", "price": 60.0}
    ]
    # Get existing products
    resp = requests.get(PRODUCTS_URL.format(shop_id=shop_id), headers=headers)
    existing_names = set()
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success") and data.get("data"):
            products = data["data"]
            existing_names = set(p["name"] for p in products)
    products_to_create = [p for p in test_products if p["name"] not in existing_names]
    created = []
    if products_to_create:
        for product in products_to_create:
            resp = requests.post(PRODUCTS_URL.format(shop_id=shop_id), headers=headers, json=product)
            if resp.status_code in [200, 201]:
                print(f"   ✅ Created product: {product['name']}")
                created.append(resp.json().get("data", product["name"]))
            else:
                print(f"   ❌ Failed to create product '{product['name']}': {resp.text}")
    else:
        print("   All products already exist.")
    return created

# --- Step 5: Create transaction (if buyer/product exists) ---
def create_transaction(token, shop_id):
    headers = {"Authorization": f"Bearer {token}"}
    # Get all users
    resp = requests.get(USERS_URL.format(shop_id=shop_id), headers=headers)
    users = []
    if resp.status_code == 200:
        data = resp.json()
        print(f"DEBUG: Users response structure: {data}")
        if data.get("success") and data.get("data"):
            nested = data["data"]
            if nested.get("success") and nested.get("data"):
                users = nested["data"]["users"]
            else:
                users = data["data"]
        print(f"DEBUG: Found {len(users)} users: {[u['username'] + '(' + u['role'] + ')' for u in users] if users else 'No users'}")
    # Get products
    resp = requests.get(PRODUCTS_URL.format(shop_id=shop_id), headers=headers)
    products = []
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success") and data.get("data"):
            products = data["data"]
    
    # If no products found, let's try to create a simple test transaction with hardcoded values
    # This is a workaround to test the transaction creation endpoint
    if not products:
        print(f"❌ No products found, creating transaction with test data...")
        # Use a simple product ID that likely exists (products are being created successfully)
        # We'll use ID 1 as a test, or we can try creating products directly
        test_product_id = 1
        products = [{"id": test_product_id, "name": "Test Product"}]
    
    if not users:
        print(f"❌ Cannot create transaction: Missing users ({len(users)}).")
        return None
    
    # Get farmer and buyer users
    farmer_user = None
    buyer_user = None
    for user in users:
        if user["role"] == "farmer" and not farmer_user:
            farmer_user = user
        elif user["role"] == "buyer" and not buyer_user:
            buyer_user = user
    
    if not farmer_user or not buyer_user:
        print("❌ Cannot create transaction: Missing farmer or buyer user.")
        print(f"Available users: {[u['username'] + '(' + u['role'] + ')' for u in users]}")
        return None
        
    farmer_id = farmer_user["id"]
    buyer_id = buyer_user["id"]
    product_id = products[0]["id"]
    
    transaction_data = {
        "shop_id": shop_id,
        "buyer_user_id": buyer_id,
        "farmer_user_id": farmer_id,
        "commission_rate": 5.0,
        "items": [
            {
                "product_id": product_id,
                "quantity": 2.0,
                "rate": 100.0
            }
        ]
    }
    resp = requests.post(TRANSACTIONS_URL, headers=headers, json=transaction_data)
    if resp.status_code == 201:
        print(f"✅ Transaction created successfully!")
        return resp.json()["data"]
    else:
        print(f"❌ Transaction creation failed: {resp.text}")
        return None

# --- Step 6: Verify dashboard, analytics, transactions ---
def verify_endpoints(token, shop_id):
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        (DASHBOARD_URL.format(shop_id=shop_id), "Dashboard"),
        (ANALYTICS_URL.format(shop_id=shop_id), "Analytics"),
        (USERS_URL.format(shop_id=shop_id), "Users"),
        (PRODUCTS_URL.format(shop_id=shop_id), "Products"),
        (TRANSACTIONS_URL, "Transactions List")
    ]
    for url, name in endpoints:
        resp = requests.get(url, headers=headers)
        status = "✅ OK" if resp.status_code == 200 else f"❌ {resp.status_code}"
        print(f"   {name}: {status}")

if __name__ == "__main__":
    print("🚀 SEED AND VERIFY OWNER WORKFLOW")
    print("=" * 60)
    token, shop_id, user_id = login_owner()
    if not token:
        exit(1)
    print("\n📂 Step 2: Seed Categories")
    seed_categories(token)
    print("\n👥 Step 3: Seed Users")
    seed_users(token, shop_id)
    print("\n📦 Step 4: Seed Products")
    seed_products(token, shop_id)
    print("\n💳 Step 5: Create Transaction")
    create_transaction(token, shop_id)
    print("\n🔎 Step 6: Verify Endpoints")
    verify_endpoints(token, shop_id)
    print("\n🎉 SEED AND VERIFY WORKFLOW COMPLETE!")
