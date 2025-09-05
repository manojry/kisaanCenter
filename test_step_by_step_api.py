#!/usr/bin/env python3
"""
Simple API Test - Test consolidated endpoints step by step
"""
import requests
import json

def test_step_by_step():
    """Test each endpoint individually"""
    print("🔧 STEP BY STEP API TEST")
    print("=" * 50)
    
    # Test 1: Health Check
    print("📋 Test 1: Health Check")
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print("   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 2: Authentication
    print("\n🔐 Test 2: Authentication")
    try:
        login_data = {"username": "reddy", "password": "reddy@123"}
        response = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            if auth_data.get('success'):
                print("   ✅ Authentication successful")
                token = auth_data['data']['access_token']
                shop_id = auth_data['data']['shop_id']
                print(f"   Shop ID: {shop_id}")
                print(f"   Token: {token[:20]}...")
                
                # Test 3: Simple API call with auth
                print(f"\n🏪 Test 3: Get Shop Info")
                headers = {"Authorization": f"Bearer {token}"}
                try:
                    response = requests.get(f"http://localhost:8000/api/v1/shops/{shop_id}", headers=headers)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        print("   ✅ Shop info retrieved")
                        shop_data = response.json()
                        if 'data' in shop_data:
                            print(f"   Shop: {shop_data['data'].get('name', 'Unknown')}")
                    else:
                        print(f"   ❌ Shop info failed: {response.text}")
                except Exception as e:
                    print(f"   ❌ Shop info error: {e}")
                
                # Test 4: Users endpoint
                print(f"\n👥 Test 4: Get Shop Users")
                try:
                    response = requests.get(f"http://localhost:8000/api/v1/owner-admin/shops/{shop_id}/users", headers=headers)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        print("   ✅ Users retrieved")
                        users_data = response.json()
                        print(f"   Response: {users_data}")
                    else:
                        print(f"   ❌ Users failed: {response.text}")
                except Exception as e:
                    print(f"   ❌ Users error: {e}")
                    
                # Test 5: Products endpoint  
                print(f"\n📦 Test 5: Get Shop Products")
                try:
                    response = requests.get(f"http://localhost:8000/api/v1/owner-admin/shops/{shop_id}/products", headers=headers)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        print("   ✅ Products retrieved")
                        products_data = response.json()
                        print(f"   Response: {products_data}")
                    else:
                        print(f"   ❌ Products failed: {response.text}")
                except Exception as e:
                    print(f"   ❌ Products error: {e}")
                
                return True
            else:
                print(f"   ❌ Auth failed: {auth_data.get('message')}")
        else:
            print(f"   ❌ Auth HTTP error: {response.text}")
    except Exception as e:
        print(f"   ❌ Auth error: {e}")
    
    return False

if __name__ == "__main__":
    try:
        test_step_by_step()
        print("\n🎉 Test completed!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
