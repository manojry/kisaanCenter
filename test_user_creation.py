#!/usr/bin/env python3
"""
Quick test to verify user creation works after enum fixes
"""
import requests
import json
import random

def test_user_creation():
    url = "http://localhost:8000/api/v1/users/"
    
    # Use a random unique username
    random_id = random.randint(10000, 99999)
    
    user_data = {
        "username": f"testowner{random_id}",
        "password": "testpass123",
        "role": "owner",
        "contact": "1234567890",
        "credit_limit": 1000.00
    }
    
    try:
        response = requests.post(url, json=user_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ User created successfully!")
            print("🎉 ENUM ISSUE IS FIXED!")
            return True
        else:
            print("❌ User creation failed")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running on http://localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing user creation with enum fix...")
    test_user_creation()
