#!/usr/bin/env python3
"""
Script to test superadmin login directly via API
"""
import requests
import json

def main():
    print("🔧 Testing superadmin login...")
    
    # Test the login endpoint
    url = "http://localhost:8000/api/v1/users/auth/login"
    params = {
        "username": "kisaanCenter",
        "password": "Kissan@2025!"
    }
    
    try:
        response = requests.post(url, params=params)
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Login Successful!")
            print(f"🎉 Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Login Failed!")
            print(f"🔍 Response Text: {response.text}")
            
    except Exception as e:
        print(f"❌ Error occurred: {e}")

if __name__ == "__main__":
    main()
