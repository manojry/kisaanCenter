#!/usr/bin/env python3
"""
Test the correct login endpoint with proper credentials
"""

import requests
import json

def test_login():
    """Test login with the correct endpoint and credentials"""
    
    # Correct endpoint as mentioned by user
    url = "http://localhost:8000/api/v1/users/auth/login"
    
    # Test with correct credentials
    credentials = {
        "username": "reddy",
        "password": "reddy@123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    
    print(f"🧪 Testing Login API")
    print(f"URL: {url}")
    print(f"Credentials: {credentials}")
    print("=" * 50)
    
    try:
        response = requests.post(url, json=credentials, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            data = response.json()
            print(f"Response Data: {json.dumps(data, indent=2)}")
            
            # Check if login was successful
            if response.status_code == 200 and data.get("success"):
                token = data.get("data", {}).get("access_token")
                user_data = data.get("data", {})
                
                print("\n✅ LOGIN SUCCESSFUL!")
                print(f"🔑 Token: {token[:20]}..." if token else "No token received")
                print(f"👤 User ID: {user_data.get('user_id')}")
                print(f"🏪 Shop ID: {user_data.get('shop_id')}")
                print(f"👑 Role: {user_data.get('role')}")
                
                # Test a protected endpoint with the token
                if token:
                    test_protected_endpoint(token, user_data.get('shop_id'))
                
            else:
                print(f"\n❌ LOGIN FAILED")
                print(f"Error: {data.get('message', 'Unknown error')}")
        
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def test_protected_endpoint(token, shop_id):
    """Test a protected endpoint with the received token"""
    if not shop_id:
        print("⚠️ No shop_id, skipping protected endpoint test")
        return
        
    print("\n🔐 Testing Protected Endpoint...")
    
    url = f"http://localhost:8000/api/v1/shops/{shop_id}/dashboard"
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Dashboard API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Dashboard API works with token!")
            print(f"Dashboard data keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")
        else:
            print(f"❌ Dashboard API failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Dashboard test failed: {str(e)}")

if __name__ == "__main__":
    test_login()
