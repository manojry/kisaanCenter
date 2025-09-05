#!/usr/bin/env python3
"""
Owner MVP Functionality Test
Test all core owner operations for marketplace management
"""

import requests
import json
from datetime import datetime

class OwnerMVPTester:
    def __init__(self, base_url="http://localhost:8000", username="reddy", password="reddy@123"):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token = None
        self.shop_id = None
        self.user_id = None
        
    def authenticate(self):
        """Login and get access token"""
        print("🔐 Authenticating owner...")
        
        login_data = {"username": self.username, "password": self.password}
        response = requests.post(f"{self.base_url}/api/v1/users/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                user_data = data["data"]
                self.token = user_data["access_token"]
                self.shop_id = user_data["shop_id"]
                self.user_id = user_data["user_id"]
                
                print(f"✅ Login successful!")
                print(f"   User ID: {self.user_id}")
                print(f"   Shop ID: {self.shop_id}")
                print(f"   Role: {user_data['role']}")
                return True
        
        print(f"❌ Authentication failed: {response.text}")
        return False
    
    @property
    def headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_shop_analytics(self):
        """Test shop analytics endpoint"""
        print(f"\n📊 Testing Shop Analytics...")
        
        url = f"{self.base_url}/api/v1/owner-admin/shops/{self.shop_id}/analytics"
        response = requests.get(url, headers=self.headers)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                analytics = data["data"]
                print(f"✅ Analytics retrieved successfully!")
                print(f"   Data keys: {list(analytics.keys())}")
                return True
        
        print(f"❌ Analytics failed: {response.text}")
        return False
    
    def test_get_shop_users(self):
        """Test getting users for the shop"""
        print(f"\n👥 Testing Get Shop Users...")
        
        url = f"{self.base_url}/api/v1/owner-admin/shops/{self.shop_id}/users"
        response = requests.get(url, headers=self.headers)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                users = data["data"]
                print(f"✅ Users retrieved successfully!")
                print(f"   Total users: {len(users) if isinstance(users, list) else 'N/A'}")
                
                # Test filtering by role
                for role in ["farmer", "buyer", "employee"]:
                    role_url = f"{url}?role={role}"
                    role_resp = requests.get(role_url, headers=self.headers)
                    if role_resp.status_code == 200:
                        role_data = role_resp.json()
                        if role_data.get("success"):
                            role_users = role_data["data"]
                            count = len(role_users) if isinstance(role_users, list) else 0
                            print(f"   {role.capitalize()}s: {count}")
                
                return True
        
        print(f"❌ Get users failed: {response.text}")
        return False
    
    def test_get_shop_products(self):
        """Test getting products for the shop"""
        print(f"\n🛒 Testing Get Shop Products...")
        
        url = f"{self.base_url}/api/v1/owner-admin/shops/{self.shop_id}/products"
        response = requests.get(url, headers=self.headers)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                products = data["data"]
                print(f"✅ Products retrieved successfully!")
                print(f"   Total products: {len(products) if isinstance(products, list) else 'N/A'}")
                return True
        
        print(f"❌ Get products failed: {response.text}")
        return False
    
    def test_create_user(self):
        """Test creating a new user (farmer/buyer)"""
        print(f"\n👤 Testing Create User...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "username": f"testfarmer_{timestamp}",
            "password": "testpass123",
            "role": "farmer",
            "shop_id": self.shop_id,
            "contact": "+91-9876543210",
            "credit_limit": 5000.0
        }
        
        url = f"{self.base_url}/api/v1/owner-admin/shops/{self.shop_id}/users"
        response = requests.post(url, json=[user_data], headers=self.headers)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✅ User created successfully!")
                return data["data"]
        
        print(f"❌ Create user failed: {response.text}")
        return None
    
    def test_owner_mvp_operations(self):
        """Test comprehensive owner MVP operations"""
        print("🏪 OWNER MVP FUNCTIONALITY TEST")
        print("=" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate():
            return False
        
        # Step 2: Core read operations
        results = {
            "analytics": self.test_shop_analytics(),
            "users": self.test_get_shop_users(), 
            "products": self.test_get_shop_products(),
        }
        
        # Step 3: Test user creation
        new_user = self.test_create_user()
        results["create_user"] = new_user is not None
        
        # Summary
        print(f"\n🎯 OWNER MVP TEST SUMMARY")
        print("=" * 40)
        passed = sum(results.values())
        total = len(results)
        
        for test, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test.capitalize()}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 OWNER MVP IS WORKING!")
        else:
            print("⚠️  Some owner functionality needs attention")
            
        return passed == total

if __name__ == "__main__":
    tester = OwnerMVPTester()
    tester.test_owner_mvp_operations()
