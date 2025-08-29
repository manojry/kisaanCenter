#!/usr/bin/env python3
"""
Final endpoint test to verify all fixes
"""
import requests
import json

def test_endpoints():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("🧪 Testing KisaanCenter API Endpoints")
    print("=" * 50)
    
    # Test users endpoint
    print("\n1. Testing Users Endpoint")
    try:
        response = requests.get(f"{base_url}/users/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Users endpoint working!")
            data = response.json()
            print(f"   📊 Response: {json.dumps(data, indent=2)[:200]}...")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test shops endpoint
    print("\n2. Testing Shops Endpoint")
    try:
        response = requests.get(f"{base_url}/shops/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Shops endpoint working!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test transactions endpoint
    print("\n3. Testing Transactions Endpoint")
    try:
        response = requests.get(f"{base_url}/transactions/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Transactions endpoint working!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing complete!")

if __name__ == "__main__":
    test_endpoints()
