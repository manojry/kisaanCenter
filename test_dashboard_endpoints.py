#!/usr/bin/env python3
"""
Test various dashboard endpoints with the authentication token
"""

import requests
import json

def test_dashboard_endpoints():
    """Test different dashboard endpoints"""
    
    # First login to get token
    login_url = "http://localhost:8000/api/v1/users/auth/login"
    credentials = {"username": "reddy", "password": "reddy@123"}
    
    print("🔓 Logging in first...")
    login_response = requests.post(login_url, json=credentials)
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
        
    login_data = login_response.json()
    token = login_data["data"]["access_token"]
    shop_id = login_data["data"]["shop_id"]
    
    print(f"✅ Login successful! Shop ID: {shop_id}")
    
    # Test different dashboard endpoints
    endpoints_to_test = [
        f"/api/v1/dashboard/owner",
        f"/api/v1/shops/{shop_id}/dashboard",
        f"/api/v1/dashboard/shop/{shop_id}",
        f"/api/v1/transactions/shop/{shop_id}/dashboard",
        f"/api/v1/owner-admin/shops/{shop_id}/analytics"
    ]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    
    print("\n🧪 Testing Dashboard Endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        test_endpoint(endpoint, headers)

def test_endpoint(endpoint, headers):
    """Test a single endpoint"""
    url = f"http://localhost:8000{endpoint}"
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {endpoint}")
            try:
                data = response.json()
                if isinstance(data, dict):
                    print(f"   Keys: {list(data.keys())[:5]}...")  # Show first 5 keys
                else:
                    print(f"   Response type: {type(data)}")
            except:
                print(f"   Response: {response.text[:100]}...")
                
        elif response.status_code == 404:
            print(f"❌ {endpoint} (404 - Not Found)")
        else:
            print(f"⚠️  {endpoint} ({response.status_code})")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"   Error: {response.text[:100]}...")
    
    except Exception as e:
        print(f"💥 {endpoint} - Exception: {str(e)}")

if __name__ == "__main__":
    test_dashboard_endpoints()
