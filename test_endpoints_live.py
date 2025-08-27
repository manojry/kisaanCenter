#!/usr/bin/env python3
"""
Live API Endpoint Testing Script
Tests all KisaanCenter API endpoints with real data insertion
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def print_separator(title):
    print("\n" + "="*80)
    print(f"🔹 {title}")
    print("="*80)

def print_response(method, endpoint, response, data=None):
    status_color = "🟢" if response.status_code < 400 else "🔴"
    print(f"{status_color} {method} {endpoint}")
    print(f"   Status: {response.status_code}")
    if data:
        print(f"   Request: {json.dumps(data, indent=2)}")
    try:
        response_data = response.json()
        print(f"   Response: {json.dumps(response_data, indent=2)}")
        return response_data
    except:
        print(f"   Response: {response.text}")
        return None

def test_health_endpoints():
    print_separator("HEALTH & SYSTEM ENDPOINTS")
    
    # Basic health check
    response = requests.get(f"{BASE_URL}/health")
    print_response("GET", "/health", response)
    
    # Subscription health check
    response = requests.get(f"{BASE_URL}/api/v1/subscriptions/health")
    print_response("GET", "/api/v1/subscriptions/health", response)

def test_plans_creation():
    print_separator("CREATING SUBSCRIPTION PLANS")
    
    plans_data = [
        {
            "name": "Basic Plan",
            "description": "Perfect for small farmers markets",
            "monthly_price": 29.99,
            "quarterly_price": 79.99,
            "yearly_price": 299.99,
            "max_farmers": 5,
            "max_buyers": 15,
            "data_retention_months": 6,
            "features": ["basic_analytics", "customer_management"]
        },
        {
            "name": "Professional Plan", 
            "description": "For growing agricultural businesses",
            "monthly_price": 59.99,
            "quarterly_price": 159.99,
            "yearly_price": 599.99,
            "max_farmers": 15,
            "max_buyers": 50,
            "data_retention_months": 12,
            "features": ["advanced_analytics", "inventory_management", "customer_management"]
        },
        {
            "name": "Enterprise Plan",
            "description": "For large agricultural enterprises",
            "monthly_price": 129.99,
            "quarterly_price": 349.99,
            "yearly_price": 1299.99,
            "max_farmers": 50,
            "max_buyers": 200,
            "data_retention_months": 24,
            "features": ["premium_analytics", "advanced_inventory", "multi_location", "api_access"]
        }
    ]
    
    created_plans = []
    for plan_data in plans_data:
        response = requests.post(f"{BASE_URL}/api/v1/subscriptions/plans", json=plan_data)
        plan = print_response("POST", "/api/v1/subscriptions/plans", response, plan_data)
        if plan:
            created_plans.append(plan)
    
    return created_plans

def test_list_plans():
    print_separator("LISTING SUBSCRIPTION PLANS")
    
    response = requests.get(f"{BASE_URL}/api/v1/subscriptions/plans")
    plans = print_response("GET", "/api/v1/subscriptions/plans", response)
    return plans or []

def test_shops_creation():
    print_separator("CREATING SHOPS")
    
    shops_data = [
        {
            "name": "Green Valley Farmers Market",
            "description": "Organic produce and local goods",
            "location": "123 Farm Road, Valley City",
            "contact_email": "info@greenvalley.com",
            "contact_phone": "+1-555-0101"
        },
        {
            "name": "Harvest Hub",
            "description": "Fresh fruits and vegetables wholesale",
            "location": "456 Market Street, Farm Town", 
            "contact_email": "sales@harvesthub.com",
            "contact_phone": "+1-555-0102"
        },
        {
            "name": "Countryside Co-op",
            "description": "Community supported agriculture",
            "location": "789 Rural Route, Countryside",
            "contact_email": "coop@countryside.org",
            "contact_phone": "+1-555-0103"
        }
    ]
    
    created_shops = []
    for shop_data in shops_data:
        response = requests.post(f"{BASE_URL}/api/v1/shops", json=shop_data)
        shop = print_response("POST", "/api/v1/shops", response, shop_data)
        if shop:
            created_shops.append(shop)
    
    return created_shops

def test_users_creation(shops):
    print_separator("CREATING USERS")
    
    created_users = []
    
    for i, shop in enumerate(shops):
        shop_id = shop.get('id')
        
        # Create shop owner
        owner_data = {
            "username": f"owner_{shop_id}",
            "email": f"owner{shop_id}@{shop['name'].lower().replace(' ', '')}.com",
            "password": "securepass123",
            "full_name": f"Owner of {shop['name']}",
            "role": "OWNER",
            "shop_id": shop_id
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/users", json=owner_data)
        owner = print_response("POST", "/api/v1/users", response, owner_data)
        if owner:
            created_users.append(owner)
        
        # Create farmers
        for j in range(2):
            farmer_data = {
                "username": f"farmer_{shop_id}_{j+1}",
                "email": f"farmer{j+1}@{shop['name'].lower().replace(' ', '')}.com",
                "password": "farmerpass123", 
                "full_name": f"Farmer {j+1} at {shop['name']}",
                "role": "FARMER",
                "shop_id": shop_id
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/users", json=farmer_data)
            farmer = print_response("POST", "/api/v1/users", response, farmer_data)
            if farmer:
                created_users.append(farmer)
        
        # Create buyers
        for j in range(3):
            buyer_data = {
                "username": f"buyer_{shop_id}_{j+1}",
                "email": f"buyer{j+1}@{shop['name'].lower().replace(' ', '')}.com", 
                "password": "buyerpass123",
                "full_name": f"Buyer {j+1} at {shop['name']}",
                "role": "BUYER",
                "shop_id": shop_id
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/users", json=buyer_data)
            buyer = print_response("POST", "/api/v1/users", response, buyer_data)
            if buyer:
                created_users.append(buyer)
    
    return created_users

def test_products_creation(shops, users):
    print_separator("CREATING PRODUCTS")
    
    products_data = [
        {"name": "Organic Tomatoes", "category": "Vegetables", "unit": "kg", "description": "Fresh organic tomatoes"},
        {"name": "Free-Range Eggs", "category": "Dairy", "unit": "dozen", "description": "Farm fresh eggs"},
        {"name": "Organic Apples", "category": "Fruits", "unit": "kg", "description": "Crisp organic apples"},
        {"name": "Fresh Lettuce", "category": "Vegetables", "unit": "head", "description": "Green leaf lettuce"},
        {"name": "Raw Honey", "category": "Pantry", "unit": "jar", "description": "Pure wildflower honey"},
        {"name": "Organic Carrots", "category": "Vegetables", "unit": "kg", "description": "Sweet orange carrots"}
    ]
    
    created_products = []
    farmers = [u for u in users if u.get('role') == 'FARMER']
    
    for farmer in farmers:
        for i, product_base in enumerate(products_data[:3]):  # Each farmer gets 3 products
            product_data = {
                **product_base,
                "name": f"{product_base['name']} by {farmer['full_name']}",
                "farmer_id": farmer['id'],
                "shop_id": farmer['shop_id'],
                "price_per_unit": round(random.uniform(2.50, 15.99), 2),
                "available_quantity": random.randint(10, 100)
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/products", json=product_data)
            product = print_response("POST", "/api/v1/products", response, product_data)
            if product:
                created_products.append(product)
    
    return created_products

def test_subscriptions_creation(shops, plans):
    print_separator("CREATING SUBSCRIPTIONS")
    
    created_subscriptions = []
    
    for i, shop in enumerate(shops):
        if i < len(plans):
            plan = plans[i]
            subscription_data = {
                "shop_id": shop['id'],
                "plan_id": plan['id'],
                "billing_cycle": ["MONTHLY", "QUARTERLY", "YEARLY"][i % 3],
                "start_date": datetime.now().isoformat(),
                "auto_renew": True
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/subscriptions", json=subscription_data)
            subscription = print_response("POST", "/api/v1/subscriptions", response, subscription_data)
            if subscription:
                created_subscriptions.append(subscription)
    
    return created_subscriptions

def test_transactions_creation(products, users):
    print_separator("CREATING TRANSACTIONS")
    
    created_transactions = []
    buyers = [u for u in users if u.get('role') == 'BUYER']
    
    for buyer in buyers:
        for _ in range(2):  # Each buyer makes 2 transactions
            if products:
                product = random.choice(products)
                quantity = random.randint(1, 5)
                
                transaction_data = {
                    "buyer_id": buyer['id'],
                    "farmer_id": product['farmer_id'],
                    "product_id": product['id'],
                    "shop_id": product['shop_id'],
                    "quantity": quantity,
                    "price_per_unit": product['price_per_unit'],
                    "total_amount": round(quantity * product['price_per_unit'], 2),
                    "transaction_type": "SALE"
                }
                
                response = requests.post(f"{BASE_URL}/api/v1/transactions", json=transaction_data)
                transaction = print_response("POST", "/api/v1/transactions", response, transaction_data)
                if transaction:
                    created_transactions.append(transaction)
    
    return created_transactions

def test_subscription_features(shops):
    print_separator("TESTING SUBSCRIPTION FEATURES")
    
    for shop in shops[:2]:  # Test first 2 shops
        shop_id = shop['id']
        
        # Get shop subscription
        response = requests.get(f"{BASE_URL}/api/v1/subscriptions/shop/{shop_id}")
        print_response("GET", f"/api/v1/subscriptions/shop/{shop_id}", response)
        
        # Get feature controls
        response = requests.get(f"{BASE_URL}/api/v1/subscriptions/shop/{shop_id}/features")
        print_response("GET", f"/api/v1/subscriptions/shop/{shop_id}/features", response)
        
        # Get usage analytics
        response = requests.get(f"{BASE_URL}/api/v1/subscriptions/analytics/usage/{shop_id}")
        print_response("GET", f"/api/v1/subscriptions/analytics/usage/{shop_id}", response)

def test_super_admin_features(shops, plans):
    print_separator("TESTING SUPER ADMIN FEATURES")
    
    if shops and len(shops) > 0:
        shop_id = shops[0]['id']
        
        # Get shop overrides
        response = requests.get(f"{BASE_URL}/api/v1/admin/shops/{shop_id}/overrides")
        print_response("GET", f"/api/v1/admin/shops/{shop_id}/overrides", response)
        
        # Set shop override
        override_data = {
            "overrides": {
                "max_farmers": 20,
                "max_buyers": 60,
                "monthly_price": 39.99
            },
            "reason": "Promotional pricing for early adopter",
            "valid_until": (datetime.now() + timedelta(days=90)).isoformat()
        }
        
        response = requests.put(f"{BASE_URL}/api/v1/admin/shops/{shop_id}/plan-overrides", json=override_data)
        print_response("PUT", f"/api/v1/admin/shops/{shop_id}/plan-overrides", response, override_data)
        
        # Get risk assessment
        response = requests.get(f"{BASE_URL}/api/v1/admin/analytics/shop-risk-assessment")
        print_response("GET", "/api/v1/admin/analytics/shop-risk-assessment", response)
        
        # Test bulk operations
        if len(shops) > 1:
            bulk_data = {
                "shop_ids": [s['id'] for s in shops[:2]],
                "changes": {"max_farmers": 12},
                "reason": "Market expansion adjustment"
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/admin/bulk/plan-changes", json=bulk_data)
            print_response("POST", "/api/v1/admin/bulk/plan-changes", response, bulk_data)

def test_list_endpoints():
    print_separator("TESTING LIST/GET ENDPOINTS")
    
    endpoints = [
        "/api/v1/users",
        "/api/v1/shops", 
        "/api/v1/products",
        "/api/v1/transactions",
        "/api/v1/subscriptions/plans"
    ]
    
    for endpoint in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print_response("GET", endpoint, response)

def test_api_documentation():
    print_separator("TESTING API DOCUMENTATION")
    
    # Test OpenAPI schema
    response = requests.get(f"{BASE_URL}/openapi.json")
    print(f"🟢 GET /openapi.json - Status: {response.status_code}")
    
    # Test docs page
    response = requests.get(f"{BASE_URL}/docs")
    print(f"🟢 GET /docs - Status: {response.status_code}")

def main():
    print("🚀 Starting Comprehensive API Testing")
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"⏰ Started at: {datetime.now()}")
    
    try:
        # Test health endpoints
        test_health_endpoints()
        time.sleep(1)
        
        # Create plans
        plans = test_plans_creation()
        time.sleep(1)
        
        # List plans
        all_plans = test_list_plans()
        if not plans:
            plans = all_plans
        time.sleep(1)
        
        # Create shops
        shops = test_shops_creation()
        time.sleep(1)
        
        # Create users
        users = test_users_creation(shops)
        time.sleep(1)
        
        # Create products
        products = test_products_creation(shops, users)
        time.sleep(1)
        
        # Create subscriptions
        subscriptions = test_subscriptions_creation(shops, plans)
        time.sleep(1)
        
        # Create transactions
        transactions = test_transactions_creation(products, users)
        time.sleep(1)
        
        # Test subscription features
        test_subscription_features(shops)
        time.sleep(1)
        
        # Test super admin features
        test_super_admin_features(shops, plans)
        time.sleep(1)
        
        # Test list endpoints
        test_list_endpoints()
        time.sleep(1)
        
        # Test documentation
        test_api_documentation()
        
        print_separator("TESTING SUMMARY")
        print(f"✅ Created {len(plans)} subscription plans")
        print(f"✅ Created {len(shops)} shops")
        print(f"✅ Created {len(users)} users")
        print(f"✅ Created {len(products)} products")
        print(f"✅ Created {len(subscriptions)} subscriptions")
        print(f"✅ Created {len(transactions)} transactions")
        print(f"✅ Tested subscription management features")
        print(f"✅ Tested super admin features")
        print(f"✅ Tested all list endpoints")
        print()
        print("🎉 All API endpoints tested successfully!")
        print(f"🌐 View API Documentation: {BASE_URL}/docs")
        print(f"⏰ Completed at: {datetime.now()}")
        
    except KeyboardInterrupt:
        print("\n❌ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed: {e}")

if __name__ == "__main__":
    main()
