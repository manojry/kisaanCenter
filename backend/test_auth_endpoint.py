#!/usr/bin/env python3
"""
Test script for the /api/v1/auth/me endpoint
"""
import requests
import json

def test_auth_me():
    url = "http://localhost:8000/api/v1/auth/me"
    
    # Test token from the logs
    token = "eyJ1c2VyX2lkIjogMSwgInVzZXJuYW1lIjogInN1cGVyYWRtaW4iLCAicm9sZSI6ICJzdXBlcmFkbWluIiwgInNob3BfaWQiOiBudWxsLCAiZXhwIjogIjIwMjUtMDktMDNUMTg6NDQ6MjQuNzE0NTgxIiwgImlhdCI6ICIyMDI1LTA5LTAyVDE4OjQ0OjI0LjcxNDU4MSJ9"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("Testing /api/v1/auth/me endpoint...")
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Auth endpoint working!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("❌ ERROR: Auth endpoint failed")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server. Is it running on localhost:8000?")
    except requests.exceptions.Timeout:
        print("❌ ERROR: Request timed out")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_auth_me()
