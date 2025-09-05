#!/usr/bin/env python3
"""
Quick API Test Script for Owner Dashboard Functionality
Tests critical endpoints needed for owner dashboard operations
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"

def test_api_endpoint(method: str, endpoint: str, data: Dict[Any, Any] = None, 
                     headers: Dict[str, str] = None) -> Dict[str, Any]:
    """Test an API endpoint and return the result"""
    url = f"{BASE_URL}{endpoint}"
    default_headers = {"accept": "application/json", "Content-Type": "application/json"}
    
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=default_headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=default_headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=default_headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, json=data, headers=default_headers)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        return {
            "status_code": response.status_code,
            "success": response.status_code < 400,
            "data": response.json() if response.content else {},
            "endpoint": endpoint
        }
    except Exception as e:
        return {
            "error": str(e),
            "endpoint": endpoint,
            "success": False
        }

def main():
    print("🚀 Testing Owner Dashboard API Endpoints")
    print("=" * 50)
    
    # Test endpoints that OwnerDashboard component needs
    test_cases = [
        # Dashboard data endpoints
        ("GET", "/shops/2/dashboard"),
        ("GET", "/shops/2/users"),
        ("GET", "/shops/2/products"),
        
        # Transaction endpoints
        ("GET", "/transactions?shop_id=2"),
        
        # Owner admin endpoints
        ("GET", "/owner-admin/shops/2/analytics"),
        ("GET", "/owner-admin/shops/2/users"),
        ("GET", "/owner-admin/shops/2/products"),
        
        # Simple endpoints (no auth required hopefully)
        ("GET", "/users"),
        ("GET", "/shops"),
        ("GET", "/products"),
    ]
    
    results = []
    for method, endpoint in test_cases:
        print(f"\n📋 Testing {method} {endpoint}")
        result = test_api_endpoint(method, endpoint)
        results.append(result)
        
        if result.get("success"):
            print(f"✅ SUCCESS - Status: {result['status_code']}")
        else:
            print(f"❌ FAILED - Status: {result.get('status_code', 'ERROR')}")
            if "error" in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Response: {result.get('data', {})}")
    
    print("\n" + "=" * 50)
    print("📊 Summary")
    print("=" * 50)
    
    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    
    if failed:
        print("\n❌ Failed Endpoints:")
        for result in failed:
            status = result.get('status_code', 'ERROR')
            endpoint = result.get('endpoint', 'Unknown')
            print(f"   - {endpoint} (Status: {status})")
    
    # Check if critical owner dashboard endpoints work
    critical_endpoints = [
        "/shops/2/dashboard",
        "/shops/2/users", 
        "/transactions"
    ]
    
    critical_working = any(
        r.get("success") and any(endpoint in r.get("endpoint", "") for endpoint in critical_endpoints)
        for r in results
    )
    
    if critical_working:
        print("\n🎉 At least some critical owner dashboard endpoints are working!")
    else:
        print("\n⚠️  Critical owner dashboard endpoints need authentication or are not working.")
        print("   This explains why the OwnerDashboard shows nothing.")
        print("\n💡 Recommendations:")
        print("   1. Implement authentication for the frontend")
        print("   2. Add public endpoints for basic dashboard data")
        print("   3. Check if middleware is blocking requests")

if __name__ == "__main__":
    main()
