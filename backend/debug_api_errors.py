#!/usr/bin/env python3
"""
Debug API Errors
Quick script to test individual API endpoints and see what's causing 500 errors
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(method, url, **kwargs):
    """Test a single endpoint and show detailed response"""
    print(f"\n🔍 Testing {method} {url}")
    try:
        response = requests.request(method, url, **kwargs)
        print(f"Status: {response.status_code}")
        
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Raw Response: {response.text}")
            
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    """Test problematic endpoints"""
    print("🚀 Debugging API Endpoints")
    print("=" * 50)
    
    # Setup auth
    print("\n1. Testing Authentication...")
    auth_response = test_endpoint("POST", f"{BASE_URL}/users/auth/login?username=superadmin&password=admin123")
    
    if auth_response and auth_response.status_code == 200:
        auth_data = auth_response.json()["data"]
        token = auth_data.get('access_token') or auth_data.get('token') or f"session_{auth_data.get('id', 'superadmin')}"
        headers = {'Authorization': f"Bearer {token}"}
        print("✅ Authentication successful")
    else:
        headers = {}
        print("❌ Authentication failed")
    
    # Test problematic endpoints
    print("\n2. Testing User Endpoints...")
    test_endpoint("GET", f"{BASE_URL}/users/2", headers=headers)
    test_endpoint("GET", f"{BASE_URL}/users?page=1&limit=10", headers=headers)
    
    print("\n3. Testing Shop Endpoints...")
    test_endpoint("GET", f"{BASE_URL}/shops/1", headers=headers)
    test_endpoint("GET", f"{BASE_URL}/shops/?page=1&limit=10", headers=headers)
    
    print("\n4. Testing Product Endpoints...")
    test_endpoint("GET", f"{BASE_URL}/products/1", headers=headers)
    test_endpoint("GET", f"{BASE_URL}/products/?page=1&limit=10", headers=headers)
    
    print("\n5. Testing Health Endpoints...")
    test_endpoint("GET", "http://127.0.0.1:8000/")
    test_endpoint("GET", "http://127.0.0.1:8000/health")
    test_endpoint("GET", f"{BASE_URL}/info")

if __name__ == "__main__":
    main()