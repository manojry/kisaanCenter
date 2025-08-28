import requests
import json

# Test superadmin login
login_data = {
    "username": "superadmin", 
    "password": "admin123"
}

print("🔐 Testing superadmin login...")
try:
    response = requests.post("http://localhost:8000/api/v1/users/auth/superadmin-login", 
                           json=login_data, 
                           headers={"Content-Type": "application/json"})
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Superadmin login successful!")
        token = response.json().get('access_token')
        print(f"🎫 Access Token: {token[:50]}..." if token else "❌ No token returned")
    else:
        print("❌ Login failed!")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {e}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test getting users endpoint
print("\n👥 Testing get users endpoint...")
try:
    response = requests.get("http://localhost:8000/api/v1/users/?role=owner")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Users endpoint working!")
        data = response.json()
        print(f"📊 Found {data.get('total', 0)} users")
    else:
        print("❌ Users endpoint failed!")
        print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test getting plans endpoint
print("\n📋 Testing get plans endpoint...")
try:
    response = requests.get("http://localhost:8000/api/v1/plans/")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Plans endpoint working!")
        data = response.json()
        print(f"📊 Found {data.get('total', 0)} plans")
    else:
        print("❌ Plans endpoint failed!")
        print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test getting shops endpoint
print("\n🏪 Testing get shops endpoint...")
try:
    response = requests.get("http://localhost:8000/api/v1/shops/")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Shops endpoint working!")
        data = response.json()
        print(f"📊 Found {data.get('total', 0)} shops")
    else:
        print("❌ Shops endpoint failed!")
        print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"❌ Error: {e}")
