#!/usr/bin/env python3
"""
Simple API Test Script

Quick test of key endpoints to demonstrate functionality.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Health Check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_basic_endpoints():
    """Test basic CRUD endpoints"""
    print("\n🧪 Testing Basic Endpoints...")
    
    # Test subscription health
    try:
        response = requests.get(f"{API_V1}/subscriptions/health", timeout=5)
        print(f"✅ Subscription Health: {response.status_code}")
    except Exception as e:
        print(f"❌ Subscription Health Failed: {e}")
    
    # Test getting plans (should be empty initially)
    try:
        response = requests.get(f"{API_V1}/subscriptions/plans", timeout=5)
        print(f"✅ Get Plans: {response.status_code} - Found {len(response.json())} plans")
    except Exception as e:
        print(f"❌ Get Plans Failed: {e}")
    
    # Test creating a plan
    plan_data = {
        "name": "Test Plan",
        "description": "A test subscription plan",
        "monthly_price": 99.99,
        "quarterly_price": 269.99,
        "yearly_price": 1019.99,
        "max_farmers": 50,
        "max_buyers": 100,
        "data_retention_months": 12,
        "features": ["basic_analytics", "farmer_management"]
    }
    
    try:
        response = requests.post(f"{API_V1}/subscriptions/plans", json=plan_data, timeout=5)
        print(f"✅ Create Plan: {response.status_code}")
        if response.status_code in [200, 201]:
            plan = response.json()
            print(f"   Created plan ID: {plan.get('id')}")
    except Exception as e:
        print(f"❌ Create Plan Failed: {e}")

def test_user_creation():
    """Test user creation"""
    print("\n👤 Testing User Creation...")
    
    user_data = {
        "username": "test_owner",
        "email": "test@example.com",
        "password": "secure123",
        "full_name": "Test Owner",
        "phone": "+91-9876543210",
        "role": "OWNER"
    }
    
    try:
        response = requests.post(f"{API_V1}/users", json=user_data, timeout=5)
        print(f"✅ Create User: {response.status_code}")
        if response.status_code in [200, 201]:
            user = response.json()
            print(f"   Created user ID: {user.get('id')} - {user.get('full_name')}")
            return user
    except Exception as e:
        print(f"❌ Create User Failed: {e}")
    
    return None

def test_shop_creation(owner_id):
    """Test shop creation"""
    print("\n🏪 Testing Shop Creation...")
    
    if not owner_id:
        print("❌ Cannot create shop - no owner ID")
        return None
    
    shop_data = {
        "name": "Test Market",
        "location": "Test City, Test State",
        "contact_number": "+91-9876543210",
        "owner_id": owner_id
    }
    
    try:
        response = requests.post(f"{API_V1}/shops", json=shop_data, timeout=5)
        print(f"✅ Create Shop: {response.status_code}")
        if response.status_code in [200, 201]:
            shop = response.json()
            print(f"   Created shop ID: {shop.get('id')} - {shop.get('name')}")
            return shop
    except Exception as e:
        print(f"❌ Create Shop Failed: {e}")
    
    return None

def main():
    """Main test function"""
    print("🚀 KisaanCenter API Quick Test")
    print("=" * 50)
    
    # Wait for server to be ready
    print("⏳ Waiting for server to be ready...")
    for i in range(10):
        if test_health():
            break
        time.sleep(1)
    else:
        print("❌ Server not responding after 10 seconds")
        return
    
    # Run tests
    test_basic_endpoints()
    user = test_user_creation()
    if user:
        shop = test_shop_creation(user.get('id'))
    
    print(f"\n🎯 Test completed!")
    print(f"📚 API Documentation: {BASE_URL}/docs")
    print(f"📋 Interactive API: {BASE_URL}/redoc")

if __name__ == "__main__":
    main()
