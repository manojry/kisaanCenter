import json
import urllib.request
import urllib.parse

def test_superadmin_login():
    # Test data
    login_data = {
        "username": "superadmin",
        "password": "admin123"
    }
    
    # Convert to JSON and encode
    json_data = json.dumps(login_data).encode('utf-8')
    
    # Create request
    req = urllib.request.Request(
        url='http://localhost:8000/api/v1/users/auth/superadmin-login',
        data=json_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        print("🔐 Testing superadmin login...")
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
            
            print(f"Status Code: {status_code}")
            if status_code == 200:
                result = json.loads(response_data)
                print("✅ Superadmin login SUCCESSFUL!")
                print(f"Response: {json.dumps(result, indent=2)}")
                if 'access_token' in result:
                    print(f"🎫 Access Token: {result['access_token'][:50]}...")
                else:
                    print("❌ No access token in response")
            else:
                print(f"❌ Login failed with status: {status_code}")
                print(f"Response: {response_data}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_superadmin_login()
