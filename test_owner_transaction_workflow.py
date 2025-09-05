#!/usr/bin/env python3
"""
Test the Owner MVP Transaction functionality 
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/users/auth/login"
DASHBOARD_URL = "{base_url}/api/v1/shops/{shop_id}/dashboard"
USERS_URL = "{base_url}/api/v1/owner-admin/shops/{shop_id}/users"  
PRODUCTS_URL = "{base_url}/api/v1/owner-admin/shops/{shop_id}/products"
TRANSACTIONS_URL = f"{BASE_URL}/api/v1/transactions"

def test_owner_transaction_workflow():
    print("🎯 OWNER TRANSACTION MVP TEST")
    print("=" * 50)
    
    # Step 1: Login as owner
    print("🔐 Step 1: Login as owner")
    
    # Use JSON data like the working test
    login_data = {"username": "reddy", "password": "reddy@123"}
    login_response = requests.post(LOGIN_URL, json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
        
    login_result = login_response.json()
    print(f"Login response: {json.dumps(login_result, indent=2)}")
    
    # Extract data from the APIResponse structure (like working test)
    login_data = login_result['data']
    token = login_data['access_token']
    shop_id = login_data['shop_id']
    user_id = login_data['user_id'] if 'user_id' in login_data else login_data.get('id')
    
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Authenticated as owner (User ID: {user_id}, Shop ID: {shop_id})")
    
    # Step 2: Get comprehensive dashboard
    print("\n📊 Step 2: Get Dashboard Data")
    dashboard_response = requests.get(DASHBOARD_URL.format(base_url=BASE_URL, shop_id=shop_id), headers=headers)
    print(f"Dashboard status: {dashboard_response.status_code}")
    
    if dashboard_response.status_code == 200:
        dashboard_data = dashboard_response.json()['data']
        print(f"✅ Dashboard loaded successfully!")
        print(f"   Shop Info: {dashboard_data.get('shop_info', {}).get('name', 'N/A')}")
        print(f"   Overview: {dashboard_data.get('overview', {})}")
        print(f"   Users by Role: {dashboard_data.get('users_by_role', {})}")
        print(f"   Financial Summary: {dashboard_data.get('financial_summary', {})}")
    else:
        print(f"❌ Dashboard failed: {dashboard_response.text}")
    
    # Step 3: Get users for transaction creation
    print("\n👥 Step 3: Get Shop Users") 
    users_response = requests.get(USERS_URL.format(base_url=BASE_URL, shop_id=shop_id), headers=headers)
    print(f"Users status: {users_response.status_code}")
    
    users = []
    buyers = []
    if users_response.status_code == 200:
        users_data = users_response.json()
        print(f"Users response: {json.dumps(users_data, indent=2)}")
        if users_data['success'] and users_data['data']:
            # Handle nested response structure
            nested_data = users_data['data']
            if nested_data['success'] and nested_data['data']:
                users_list = nested_data['data']['users']
                if isinstance(users_list, list):
                    users = users_list
                    buyers = [u for u in users if u['role'] == 'buyer']
                    print(f"✅ Found {len(users)} users, {len(buyers)} buyers")
                    for user in users:
                        print(f"   - {user['username']} ({user['role']})")
                else:
                    print(f"❌ Users list is not a list: {type(users_list)}")
            else:
                print("❌ No nested users data in response")
        else:
            print("❌ No users data in response")
    else:
        print(f"❌ Users fetch failed: {users_response.text}")
        
    # Step 4: Get products
    print("\n📦 Step 4: Get Shop Products")
    products_response = requests.get(PRODUCTS_URL.format(base_url=BASE_URL, shop_id=shop_id), headers=headers)
    print(f"Products status: {products_response.status_code}")
    
    products = []
    if products_response.status_code == 200:
        products_data = products_response.json()
        if products_data['success'] and products_data['data']:
            products = products_data['data'] 
            print(f"✅ Found {len(products)} products")
            for product in products[:3]:  # Show first 3
                print(f"   - {product['name']} (₹{product.get('price', 'N/A')})")
        else:
            print("❌ No products data in response")
    else:
        print(f"❌ Products fetch failed: {products_response.text}")

    # Step 5: Create a transaction if we have buyers and products
    if buyers and products:
        print("\n💰 Step 5: Create Transaction")
        
        buyer_id = buyers[0]['id']
        product_id = products[0]['id']
        
        transaction_data = {
            "buyer_user_id": buyer_id,
            "type": "sale",
            "commission_rate": 5.0,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2.0,
                    "price_per_unit": 100.0
                }
            ],
            "farmer_paid_amount": 0,
            "commission_confirmed": False,
            "buyer_paid_amount": 0,
            "shop_id": shop_id
        }
        
        create_response = requests.post(TRANSACTIONS_URL, headers=headers, json=transaction_data)
        print(f"Create transaction status: {create_response.status_code}")
        
        if create_response.status_code == 201:
            transaction = create_response.json()['data']
            transaction_id = transaction['id']
            print(f"✅ Transaction created successfully!")
            print(f"   Transaction ID: {transaction_id}")
            print(f"   Total Amount: ₹{transaction['total_amount']}")
            print(f"   Buyer: {buyers[0]['username']}")
            
            # Step 6: Get today's transactions
            print("\n📅 Step 6: Get Today's Transactions")
            today = datetime.now().strftime("%Y-%m-%d")
            params = {
                "shop_id": shop_id,
                "date_from": today,
                "date_to": today
            }
            
            list_response = requests.get(TRANSACTIONS_URL, headers=headers, params=params)
            print(f"List transactions status: {list_response.status_code}")
            
            if list_response.status_code == 200:
                transactions = list_response.json()['data']
                print(f"✅ Found {len(transactions)} transactions for today")
                
                for txn in transactions:
                    print(f"   - Transaction #{txn['id']}: ₹{txn['total_amount']} ({txn['type']})")
                    
            else:
                print(f"❌ List transactions failed: {list_response.text}")
                
        else:
            print(f"❌ Transaction creation failed: {create_response.text}")
    else:
        print("\n❌ Cannot create transaction: Missing buyers or products")
    
    # Step 7: Get transactions for different dates (last 7 days)
    print("\n📆 Step 7: Get Transactions for Last 7 Days")
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        params = {
            "shop_id": shop_id,
            "date_from": date,
            "date_to": date
        }
        
        list_response = requests.get(TRANSACTIONS_URL, headers=headers, params=params)
        if list_response.status_code == 200:
            transactions = list_response.json()['data']
            print(f"   {date}: {len(transactions)} transactions")
        else:
            print(f"   {date}: Error ({list_response.status_code})")
            
    print("\n🎉 OWNER TRANSACTION MVP TEST COMPLETED!")
    return True

if __name__ == "__main__":
    try:
        test_owner_transaction_workflow()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
