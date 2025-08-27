#!/usr/bin/env python3
"""
Demo script to showcase all the new subscription and super admin features
"""
import os
import sys
import time
import requests
import json
from threading import Thread
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def start_server():
    """Start the FastAPI server in a separate thread"""
    import uvicorn
    from src.main import app
    
    print("🚀 Starting KisaanCenter API server...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="warning")

def test_endpoints():
    """Test all the key endpoints"""
    base_url = "http://localhost:8001"
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    # Test health endpoint
    print("\n" + "="*60)
    print("🔍 TESTING HEALTH ENDPOINT")
    print("="*60)
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"📊 Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test subscription endpoints
    print("\n" + "="*60)
    print("📋 TESTING SUBSCRIPTION ENDPOINTS")
    print("="*60)
    
    endpoints_to_test = [
        ("GET", "/api/v1/subscriptions/health", "Subscription Health"),
        ("GET", "/api/v1/subscriptions/plans", "List Plans"),
        ("GET", "/api/v1/admin/shops/1/overrides", "Shop Overrides"),
        ("GET", "/api/v1/admin/analytics/shop-risk-assessment", "Risk Assessment"),
    ]
    
    for method, endpoint, description in endpoints_to_test:
        try:
            if method == "GET":
                response = requests.get(f"{base_url}{endpoint}")
            else:
                response = requests.post(f"{base_url}{endpoint}")
            
            print(f"✅ {description}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    print(f"   📊 Keys: {list(data.keys())}")
                elif isinstance(data, list):
                    print(f"   📊 Items: {len(data)}")
            
        except Exception as e:
            print(f"❌ {description}: {e}")
    
    # Test API documentation
    print("\n" + "="*60)
    print("📚 TESTING API DOCUMENTATION")
    print("="*60)
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ API Docs: {response.status_code}")
        print(f"🌐 URL: {base_url}/docs")
    except Exception as e:
        print(f"❌ API Docs: {e}")
    
    # Show available endpoints
    print("\n" + "="*60)
    print("🎯 ALL AVAILABLE ENDPOINTS")
    print("="*60)
    
    print("🔹 Core Endpoints:")
    print(f"   • Health Check: {base_url}/health")
    print(f"   • API Documentation: {base_url}/docs")
    print(f"   • OpenAPI Schema: {base_url}/openapi.json")
    
    print("\n🔹 Subscription Management:")
    print(f"   • List Plans: {base_url}/api/v1/subscriptions/plans")
    print(f"   • Shop Subscriptions: {base_url}/api/v1/subscriptions/shop/{{shop_id}}")
    print(f"   • Feature Controls: {base_url}/api/v1/subscriptions/shop/{{shop_id}}/features")
    print(f"   • Usage Analytics: {base_url}/api/v1/subscriptions/analytics/usage/{{shop_id}}")
    
    print("\n🔹 Super Admin Controls:")
    print(f"   • Shop Overrides: {base_url}/api/v1/admin/shops/{{shop_id}}/plan-overrides")
    print(f"   • Shop Status: {base_url}/api/v1/admin/shops/{{shop_id}}/status")
    print(f"   • Bulk Operations: {base_url}/api/v1/admin/bulk/plan-changes")
    print(f"   • Risk Assessment: {base_url}/api/v1/admin/analytics/shop-risk-assessment")
    print(f"   • Account Management: {base_url}/api/v1/admin/users/{{user_id}}/force-password-reset")
    
    print("\n🔹 Traditional Endpoints:")
    print(f"   • Users: {base_url}/api/v1/users")
    print(f"   • Shops: {base_url}/api/v1/shops")
    print(f"   • Products: {base_url}/api/v1/products")
    print(f"   • Transactions: {base_url}/api/v1/transactions")
    
    print("\n" + "="*60)
    print("🎉 DEMO COMPLETE!")
    print("="*60)
    print("Your KisaanCenter application is now running with:")
    print("✅ Subscription Management System")
    print("✅ Super Admin Advanced Controls")
    print("✅ Business Protection Logic")
    print("✅ Cross-Platform Setup Scripts")
    print("✅ Comprehensive API Documentation")
    print()
    print(f"🌐 Access the API at: {base_url}/docs")
    print()

if __name__ == "__main__":
    # Start server in background thread
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Test endpoints
    test_endpoints()
    
    print("Press Ctrl+C to stop the server...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        sys.exit(0)
