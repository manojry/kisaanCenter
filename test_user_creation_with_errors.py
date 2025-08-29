#!/usr/bin/env python3
"""
Test user creation with improved error handling
"""

import requests
import json
import random
import string

# Configuration
BASE_URL = "http://127.0.0.1:8000"

def generate_random_username():
    """Generate a random username to avoid conflicts"""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"testowner_{suffix}"

def test_successful_user_creation():
    """Test successful user creation"""
    print("🧪 Testing successful user creation...")
    
    username = generate_random_username()
    user_data = {
        "username": username,
        "password": "secure123",
        "role": "owner", 
        "shop_id": 1,
        "contact": "+91-9876543210",
        "credit_limit": 50000.0
    }
    
    response = requests.post(f"{BASE_URL}/api/users/", json=user_data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        data = response.json()
        if data.get("success"):
            print("✅ User creation successful!")
            return data["data"]["id"]
        else:
            print("❌ User creation failed despite 201 status")
    else:
        print("❌ User creation failed")
    return None

def test_duplicate_username_error():
    """Test duplicate username error handling"""
    print("\n🧪 Testing duplicate username error...")
    
    # First create a user
    username = generate_random_username()
    user_data = {
        "username": username,
        "password": "secure123",
        "role": "owner",
        "shop_id": 1,
        "contact": "+91-9876543210",
        "credit_limit": 50000.0
    }
    
    # Create first user
    response1 = requests.post(f"{BASE_URL}/api/users/", json=user_data)
    print(f"First creation - Status Code: {response1.status_code}")
    
    # Try to create same user again
    response2 = requests.post(f"{BASE_URL}/api/users/", json=user_data)
    print(f"Duplicate creation - Status Code: {response2.status_code}")
    print(f"Response: {json.dumps(response2.json(), indent=2)}")
    
    if response2.status_code == 400:
        data = response2.json()
        if "already exists" in data.get("detail", {}).get("message", ""):
            print("✅ Duplicate username error handled properly!")
        else:
            print("❌ Wrong error message for duplicate username")
    else:
        print("❌ Wrong status code for duplicate username")

def test_invalid_data_error():
    """Test invalid data error handling"""
    print("\n🧪 Testing invalid role error...")
    
    username = generate_random_username()
    user_data = {
        "username": username,
        "password": "secure123",
        "role": "invalid_role",  # Invalid role
        "shop_id": 1,
        "contact": "+91-9876543210", 
        "credit_limit": 50000.0
    }
    
    response = requests.post(f"{BASE_URL}/api/users/", json=user_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 422:
        print("✅ Invalid data error handled by FastAPI validation!")
    else:
        print("❌ Invalid data not handled properly")

def main():
    print("🚀 Testing User Creation with Error Handling")
    print("=" * 50)
    
    try:
        # Test successful creation
        user_id = test_successful_user_creation()
        
        # Test duplicate username error
        test_duplicate_username_error()
        
        # Test invalid data error
        test_invalid_data_error()
        
        print("\n✅ All error handling tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the API. Make sure the server is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()
