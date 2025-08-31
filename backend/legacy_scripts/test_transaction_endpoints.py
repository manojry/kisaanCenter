#!/usr/bin/env python3
"""
Test script to verify transaction endpoints are working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test the transaction endpoints"""
    
    endpoints_to_test = [
        "/api/v1/transactions?params[shop_id]=1&params[limit]=50",
        "/api/v1/transactions/completion-status/pending?params[shop_id]=1",
        "/api/v1/transactions/shop/1/dashboard",
        "/api/v1/transactions",
        "/health"
    ]
    
    print("🧪 Testing Transaction Endpoints")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{BASE_URL}{endpoint}"
            print(f"\n📡 Testing: {endpoint}")
            
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"✅ SUCCESS - Status: {response.status_code}")
                try:
                    data = response.json()
                    if 'data' in data:
                        print(f"📊 Data keys: {list(data['data'].keys()) if isinstance(data['data'], dict) else 'List/Other'}")
                except:
                    print("📄 Response is not JSON")
            else:
                print(f"❌ FAILED - Status: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"🔌 CONNECTION ERROR - Server not running on {BASE_URL}")
            break
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("✅ Test completed")

if __name__ == "__main__":
    test_endpoints()