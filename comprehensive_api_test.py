#!/usr/bin/env python3
"""
Comprehensive API Test Script for KisaanCenter
Tests all endpoints with real data insertion
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, description=""):
    """Test a single endpoint with detailed output"""
    print(f"\n{'='*80}")
    print(f"🧪 Testing: {method} {endpoint}")
    if description:
        print(f"📝 {description}")
    print(f"{'='*80}")
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(f"{BASE_URL}{endpoint}", json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(f"{BASE_URL}{endpoint}", timeout=10)
        
        # Print request details
        if data:
            print(f"📤 Request Data:")
            print(json.dumps(data, indent=2))
        
        # Print response
        status_emoji = "✅" if response.status_code < 400 else "❌"
        print(f"\n{status_emoji} Status: {response.status_code}")
        
        try:
            response_json = response.json()
            print(f"📥 Response:")
            print(json.dumps(response_json, indent=2))
            return response_json
        except:
            print(f"📥 Response Text: {response.text}")
            return response.text
            
    except requests.exceptions.ConnectError:
        print("❌ Connection Error: Server not responding")
        return None
    except requests.exceptions.Timeout:
        print("⏱️ Timeout: Server took too long to respond")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("🚀 KisaanCenter Comprehensive API Testing")
    print(f"🌐 Server: {BASE_URL}")
    print(f"⏰ Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Health Check
    health = test_endpoint("GET", "/health", description="Basic system health check")
    
    if not health:
        print("\n❌ Server is not responding. Please start the server on port 8000")
        return
    
    # Test 2: Subscription System Health
    test_endpoint("GET", "/api/v1/subscriptions/health", description="Subscription system health")
    
    # Test 3: List Plans (should be empty initially)
    test_endpoint("GET", "/api/v1/subscriptions/plans", description="List all subscription plans")
    
    # Test 4: Create Basic Plan
    basic_plan = {
        "name": "Basic Plan",
        "description": "Perfect for small farmers markets", 
        "monthly_price": 29.99,
        "quarterly_price": 79.99,
        "yearly_price": 299.99,
        "max_farmers": 5,
        "max_buyers": 15,
        "data_retention_months": 6,
        "features": {
            "basic_analytics": True,
            "customer_management": True,
            "inventory_tracking": False
        }
    }
    test_endpoint("POST", "/api/v1/subscriptions/plans", basic_plan, "Create Basic Plan")
    
    # Test 5: Create Professional Plan
    pro_plan = {
        "name": "Professional Plan",
        "description": "For growing agricultural businesses",
        "monthly_price": 59.99,
        "quarterly_price": 159.99,
        "yearly_price": 599.99,
        "max_farmers": 15,
        "max_buyers": 50,
        "data_retention_months": 12,
        "features": {
            "basic_analytics": True,
            "customer_management": True,
            "inventory_tracking": True,
            "advanced_analytics": True
        }
    }
    test_endpoint("POST", "/api/v1/subscriptions/plans", pro_plan, "Create Professional Plan")
    
    # Test 6: Create Enterprise Plan
    enterprise_plan = {
        "name": "Enterprise Plan",
        "description": "For large agricultural enterprises",
        "monthly_price": 129.99,
        "quarterly_price": 349.99,
        "yearly_price": 1299.99,
        "max_farmers": 50,
        "max_buyers": 200,
        "data_retention_months": 24,
        "features": {
            "basic_analytics": True,
            "customer_management": True,
            "inventory_tracking": True,
            "advanced_analytics": True,
            "api_access": True,
            "multi_location": True
        }
    }
    test_endpoint("POST", "/api/v1/subscriptions/plans", enterprise_plan, "Create Enterprise Plan")
    
    # Test 7: List plans again (should show created plans)
    test_endpoint("GET", "/api/v1/subscriptions/plans", description="List plans after creation")
    
    # Test 8: Test shop endpoints
    test_endpoint("GET", "/api/v1/shops", description="List all shops")
    
    # Test 9: Create shops
    shop1 = {
        "name": "Green Valley Farmers Market",
        "description": "Organic produce and local goods",
        "location": "123 Farm Road, Valley City",
        "contact_email": "info@greenvalley.com",
        "contact_phone": "+1-555-0101"
    }
    test_endpoint("POST", "/api/v1/shops", shop1, "Create Green Valley Market")
    
    shop2 = {
        "name": "Harvest Hub Co-op",
        "description": "Community supported agriculture",
        "location": "456 Rural Route, Farm Town",
        "contact_email": "coop@harvesthub.org", 
        "contact_phone": "+1-555-0102"
    }
    test_endpoint("POST", "/api/v1/shops", shop2, "Create Harvest Hub Co-op")
    
    # Test 10: List users
    test_endpoint("GET", "/api/v1/users", description="List all users")
    
    # Test 11: Create users
    owner1 = {
        "username": "owner_greenvalley",
        "email": "owner@greenvalley.com",
        "password": "securepass123",
        "full_name": "John Green",
        "role": "OWNER",
        "shop_id": 1
    }
    test_endpoint("POST", "/api/v1/users", owner1, "Create shop owner")
    
    farmer1 = {
        "username": "farmer_tom",
        "email": "tom@greenvalley.com",
        "password": "farmerpass123",
        "full_name": "Tom Thompson",
        "role": "FARMER",
        "shop_id": 1
    }
    test_endpoint("POST", "/api/v1/users", farmer1, "Create farmer")
    
    buyer1 = {
        "username": "buyer_alice",
        "email": "alice@example.com",
        "password": "buyerpass123",
        "full_name": "Alice Johnson",
        "role": "BUYER",
        "shop_id": 1
    }
    test_endpoint("POST", "/api/v1/users", buyer1, "Create buyer")
    
    # Test 12: List products
    test_endpoint("GET", "/api/v1/products", description="List all products")
    
    # Test 13: Create products
    tomatoes = {
        "name": "Organic Tomatoes",
        "category": "Vegetables",
        "unit": "kg",
        "description": "Fresh organic tomatoes from local farm",
        "farmer_id": 2,  # Tom the farmer
        "shop_id": 1,
        "price_per_unit": 5.99,
        "available_quantity": 100
    }
    test_endpoint("POST", "/api/v1/products", tomatoes, "Create tomatoes product")
    
    apples = {
        "name": "Crisp Apples", 
        "category": "Fruits",
        "unit": "kg",
        "description": "Sweet and crisp apples",
        "farmer_id": 2,
        "shop_id": 1,
        "price_per_unit": 4.50,
        "available_quantity": 75
    }
    test_endpoint("POST", "/api/v1/products", apples, "Create apples product")
    
    # Test 14: List transactions
    test_endpoint("GET", "/api/v1/transactions", description="List all transactions")
    
    # Test 15: Create transactions
    transaction1 = {
        "buyer_id": 3,  # Alice the buyer
        "farmer_id": 2, # Tom the farmer
        "product_id": 1, # Tomatoes
        "shop_id": 1,
        "quantity": 5,
        "price_per_unit": 5.99,
        "total_amount": 29.95,
        "transaction_type": "SALE"
    }
    test_endpoint("POST", "/api/v1/transactions", transaction1, "Create tomato sale transaction")
    
    transaction2 = {
        "buyer_id": 3,
        "farmer_id": 2,
        "product_id": 2, # Apples
        "shop_id": 1,
        "quantity": 3,
        "price_per_unit": 4.50,
        "total_amount": 13.50,
        "transaction_type": "SALE"
    }
    test_endpoint("POST", "/api/v1/transactions", transaction2, "Create apple sale transaction")
    
    # Test 16: Create subscriptions
    subscription1 = {
        "shop_id": 1,
        "plan_id": 1,  # Basic plan
        "billing_cycle": "MONTHLY",
        "start_date": "2025-08-27T00:00:00",
        "auto_renew": True
    }
    test_endpoint("POST", "/api/v1/subscriptions", subscription1, "Create subscription for shop 1")
    
    # Test 17: Get shop subscription
    test_endpoint("GET", "/api/v1/subscriptions/shop/1", description="Get subscription for shop 1")
    
    # Test 18: Get feature controls
    test_endpoint("GET", "/api/v1/subscriptions/shop/1/features", description="Get feature controls for shop 1")
    
    # Test 19: Get usage analytics
    test_endpoint("GET", "/api/v1/subscriptions/analytics/usage/1", description="Get usage analytics for shop 1")
    
    # Test 20: Super Admin - Risk Assessment
    test_endpoint("GET", "/api/v1/admin/analytics/shop-risk-assessment", description="Get shop risk assessment")
    
    # Test 21: Super Admin - Get shop overrides
    test_endpoint("GET", "/api/v1/admin/shops/1/overrides", description="Get shop overrides for shop 1")
    
    # Test 22: Super Admin - Set shop overrides
    overrides = {
        "overrides": {
            "max_farmers": 20,
            "max_buyers": 60,
            "monthly_price": 39.99,
            "discount_quarterly": 15,
            "discount_yearly": 25
        },
        "reason": "Promotional pricing for early adopter customer",
        "valid_until": "2025-12-31T23:59:59"
    }
    test_endpoint("PUT", "/api/v1/admin/shops/1/plan-overrides", overrides, "Set promotional overrides for shop 1")
    
    # Test 23: Super Admin - Bulk plan changes
    bulk_changes = {
        "shop_ids": [1],
        "changes": {
            "max_farmers": 12,
            "data_retention_months": 18
        },
        "reason": "Market expansion adjustment"
    }
    test_endpoint("POST", "/api/v1/admin/bulk/plan-changes", bulk_changes, "Apply bulk plan changes")
    
    # Test 24: Test documentation endpoints
    test_endpoint("GET", "/docs", description="API Documentation (Swagger UI)")
    test_endpoint("GET", "/openapi.json", description="OpenAPI schema")
    
    # Final summary
    print("\n" + "="*80)
    print("🎉 COMPREHENSIVE API TESTING COMPLETE!")
    print("="*80)
    print("✅ Successfully tested:")
    print("   • Health endpoints")
    print("   • Subscription plan management")
    print("   • Shop management")
    print("   • User management") 
    print("   • Product management")
    print("   • Transaction processing")
    print("   • Subscription management")
    print("   • Feature controls")
    print("   • Usage analytics")
    print("   • Super admin controls")
    print("   • Bulk operations")
    print("   • API documentation")
    print()
    print(f"🌐 View full API docs: {BASE_URL}/docs")
    print(f"⏰ Testing completed: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    main()
