#!/usr/bin/env python3
"""
Test login API
"""
import requests
import json

def test_login():
    """Test login API"""
    
    # Test with query parameters
    print("Testing login with query parameters...")
    url = "http://localhost:8000/api/v1/auth/login"
    params = {
        "username": "reddy",
        "password": "reddy@123"
    }
    
    try:
        response = requests.post(url, params=params)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Login successful!")
                if 'data' in data and 'access_token' in data['data']:
                    token = data['data']['access_token']
                    print(f"Access Token: {token[:20]}...")
                    
                    # Test authenticated API call
                    print("\nTesting authenticated API call...")
                    headers = {"Authorization": f"Bearer {token}"}
                    dashboard_url = "http://localhost:8000/api/v1/shops/2/dashboard"
                    dash_response = requests.get(dashboard_url, headers=headers)
                    print(f"Dashboard API Status: {dash_response.status_code}")
                    print(f"Dashboard API Response: {dash_response.text}")
            else:
                print("❌ Login failed:", data.get('message'))
        else:
            print("❌ HTTP Error:", response.status_code)
            
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test with JSON body
    print("\n" + "="*50)
    print("Testing login with JSON body...")
    
    try:
        headers = {"Content-Type": "application/json"}
        data = {
            "username": "reddy",
            "password": "reddy@123"
        }
        
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()
