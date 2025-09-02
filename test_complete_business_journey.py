"""
Comprehensive Business Journey Test Script
Tests the complete user flow from superadmin to owner to transactions

Run this script to validate:
1. Superadmin creating owner, assigning plans, categories
2. Owner logging in and adding farmer/buyer, setting commission, selecting products  
3. Transaction handling with payment/commission logic
4. All endpoints functioning correctly

Usage: python test_complete_business_journey.py
"""

import requests
import json
import time
from typing import Dict, Any

class BusinessJourneyTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_data = {}
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
    
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make HTTP request and return response"""
        url = f"{self.base_url}/api/v1{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=data)
            elif method.upper() == "POST":
                response = requests.post(url, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url)
            else:
                return {"error": f"Unsupported method: {method}"}
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def test_server_health(self):
        """Test 1: Check if server is running"""
        print("\n=== Testing Server Health ===")
        
        response = self.make_request("GET", "/health")
        if response.get("success"):
            self.log_test("Server Health Check", True, "API server is running")
        else:
            self.log_test("Server Health Check", False, f"Server not responding: {response.get('error', 'Unknown error')}")
    
    def test_superadmin_journeys(self):
        """Test 2-8: Superadmin business journeys"""
        print("\n=== Testing Superadmin Journeys ===")
        
        # Test creating categories
        category_data = {
            "name": "Test Electronics",
            "description": "Electronics for testing"
        }
        response = self.make_request("POST", "/categories", category_data)
        category_created = response.get("success", False)
        if category_created and response.get("data", {}).get("id"):
            self.test_data["category_id"] = response["data"]["id"]
        self.log_test("Create Category", category_created)
        
        # Test creating products
        product_data = {
            "name": "Test Mobile Phone",
            "category_id": self.test_data.get("category_id", 1),
            "price": 15000.00,
            "description": "Test mobile phone"
        }
        response = self.make_request("POST", "/products", product_data)
        product_created = response.get("success", False)
        if product_created and response.get("data", {}).get("id"):
            self.test_data["product_id"] = response["data"]["id"]
        self.log_test("Create Product", product_created)
        
        # Test creating plan
        plan_data = {
            "name": "Test Premium Plan",
            "price": 5000.00,
            "duration": 30,
            "features": ["product_management", "transaction_tracking"]
        }
        response = self.make_request("POST", "/plans", plan_data)
        plan_created = response.get("success", False)
        if plan_created and response.get("data", {}).get("id"):
            self.test_data["plan_id"] = response["data"]["id"]
        self.log_test("Create Plan", plan_created)
        
        # Test creating owner user
        owner_data = {
            "username": "test_owner_123",
            "password": "securepass123",
            "email": "test.owner@example.com",
            "phone_number": "9876543210",
            "full_name": "Test Owner",
            "role": "owner"
        }
        response = self.make_request("POST", "/users", owner_data)
        owner_created = response.get("success", False)
        if owner_created and response.get("data", {}).get("id"):
            self.test_data["owner_id"] = response["data"]["id"]
        self.log_test("Create Owner User", owner_created)
        
        # Test creating shop for owner
        shop_data = {
            "name": "Test Electronics Shop",
            "address": "123 Test Street, Test City",
            "phone_number": "9876543211",
            "email": "shop@example.com",
            "owner_id": self.test_data.get("owner_id"),
            "plan_id": self.test_data.get("plan_id")
        }
        response = self.make_request("POST", "/shops", shop_data)
        shop_created = response.get("success", False)
        if shop_created and response.get("data", {}).get("id"):
            self.test_data["shop_id"] = response["data"]["id"]
        self.log_test("Create Shop", shop_created)
        
        # Test assigning plan to shop
        if self.test_data.get("shop_id") and self.test_data.get("plan_id"):
            response = self.make_request("PUT", f"/admin/shops/{self.test_data['shop_id']}/plan", 
                                       {"plan_id": self.test_data["plan_id"]})
            self.log_test("Assign Plan to Shop", response.get("success", False))
        
        # Test assigning category to shop
        if self.test_data.get("category_id") and self.test_data.get("shop_id"):
            response = self.make_request("POST", f"/admin/categories/{self.test_data['category_id']}/shops",
                                       {"shop_ids": [self.test_data["shop_id"]]})
            self.log_test("Assign Category to Shop", response.get("success", False))
    
    def test_owner_journeys(self):
        """Test 9-14: Owner business journeys"""
        print("\n=== Testing Owner Journeys ===")
        
        # Test creating farmer
        farmer_data = {
            "username": "test_farmer_123",
            "password": "farmerpass123",
            "email": "farmer@example.com",
            "phone_number": "9876543212",
            "full_name": "Test Farmer",
            "role": "farmer",
            "shop_id": self.test_data.get("shop_id")
        }
        response = self.make_request("POST", "/users", farmer_data)
        farmer_created = response.get("success", False)
        if farmer_created and response.get("data", {}).get("id"):
            self.test_data["farmer_id"] = response["data"]["id"]
        self.log_test("Create Farmer", farmer_created)
        
        # Test creating buyer
        buyer_data = {
            "username": "test_buyer_123", 
            "password": "buyerpass123",
            "email": "buyer@example.com",
            "phone_number": "9876543213",
            "full_name": "Test Buyer",
            "role": "buyer",
            "shop_id": self.test_data.get("shop_id")
        }
        response = self.make_request("POST", "/users", buyer_data)
        buyer_created = response.get("success", False)
        if buyer_created and response.get("data", {}).get("id"):
            self.test_data["buyer_id"] = response["data"]["id"]
        self.log_test("Create Buyer", buyer_created)
        
        # Test getting available products for owner
        response = self.make_request("GET", "/owner/products/available")
        self.log_test("Get Available Products", response.get("success", False))
        
        # Test assigning products to shop
        if self.test_data.get("shop_id") and self.test_data.get("product_id"):
            response = self.make_request("POST", f"/owner/products/shop/{self.test_data['shop_id']}/assign",
                                       {"product_ids": [self.test_data["product_id"]]})
            self.log_test("Assign Products to Shop", response.get("success", False))
        
        # Test getting shop products
        if self.test_data.get("shop_id"):
            response = self.make_request("GET", f"/owner/products/shop/{self.test_data['shop_id']}")
            self.log_test("Get Shop Products", response.get("success", False))
        
        # Test getting product categories
        response = self.make_request("GET", "/owner/products/categories")
        self.log_test("Get Product Categories", response.get("success", False))
    
    def test_transaction_journeys(self):
        """Test 15-20: Transaction business journeys"""
        print("\n=== Testing Transaction Journeys ===")
        
        # Test getting farmers for transaction
        if self.test_data.get("shop_id"):
            response = self.make_request("GET", f"/transactions/farmers/{self.test_data['shop_id']}")
            self.log_test("Get Farmers for Transaction", response.get("success", False))
        
        # Test getting buyers for transaction
        if self.test_data.get("shop_id"):
            response = self.make_request("GET", f"/transactions/buyers/{self.test_data['shop_id']}")
            self.log_test("Get Buyers for Transaction", response.get("success", False))
        
        # Test getting products for transaction
        if self.test_data.get("shop_id"):
            response = self.make_request("GET", f"/transactions/products/{self.test_data['shop_id']}")
            self.log_test("Get Products for Transaction", response.get("success", False))
        
        # Test creating a transaction
        transaction_data = {
            "farmer_id": self.test_data.get("farmer_id"),
            "buyer_id": self.test_data.get("buyer_id"), 
            "product_id": self.test_data.get("product_id"),
            "quantity": 10.0,
            "unit_price": 100.0,
            "commission_rate": 2.5
        }
        
        if all([self.test_data.get(key) for key in ["farmer_id", "buyer_id", "product_id"]]):
            response = self.make_request("POST", "/transactions", transaction_data)
            transaction_created = response.get("success", False)
            if transaction_created and response.get("data", {}).get("id"):
                self.test_data["transaction_id"] = response["data"]["id"]
            self.log_test("Create Transaction", transaction_created)
        else:
            self.log_test("Create Transaction", False, "Missing required user IDs")
        
        # Test getting transaction details
        if self.test_data.get("transaction_id"):
            response = self.make_request("GET", f"/transactions/{self.test_data['transaction_id']}")
            self.log_test("Get Transaction Details", response.get("success", False))
        
        # Test processing payment
        if self.test_data.get("transaction_id"):
            payment_data = {
                "amount": 1000.0,
                "payment_method": "cash"
            }
            response = self.make_request("POST", f"/transactions/{self.test_data['transaction_id']}/payments", 
                                       payment_data)
            self.log_test("Process Payment", response.get("success", False))
    
    def test_system_endpoints(self):
        """Test 21-25: System and administrative endpoints"""
        print("\n=== Testing System Endpoints ===")
        
        # Test getting all users
        response = self.make_request("GET", "/users")
        self.log_test("Get All Users", response.get("success", False))
        
        # Test getting all shops
        response = self.make_request("GET", "/shops")
        self.log_test("Get All Shops", response.get("success", False))
        
        # Test getting all products
        response = self.make_request("GET", "/products")
        self.log_test("Get All Products", response.get("success", False))
        
        # Test getting all categories
        response = self.make_request("GET", "/categories")
        self.log_test("Get All Categories", response.get("success", False))
        
        # Test getting all transactions
        response = self.make_request("GET", "/transactions")
        self.log_test("Get All Transactions", response.get("success", False))
    
    def cleanup_test_data(self):
        """Clean up test data (optional)"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Note: In a real scenario, you might want to clean up test data
        # For this test, we'll leave the data for manual inspection
        self.log_test("Cleanup", True, "Test data left for manual inspection")
    
    def run_all_tests(self):
        """Run the complete business journey test suite"""
        print("🚀 Starting Comprehensive Business Journey Tests")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_server_health()
        self.test_superadmin_journeys()
        self.test_owner_journeys()
        self.test_transaction_journeys()
        self.test_system_endpoints()
        self.cleanup_test_data()
        
        # Print final summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        success_rate = (self.passed_tests / (self.passed_tests + self.failed_tests)) * 100 if (self.passed_tests + self.failed_tests) > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests == 0:
            print("🎉 ALL TESTS PASSED! Your business journey is fully functional.")
        else:
            print(f"⚠️  {self.failed_tests} tests failed. Please check the endpoints and try again.")
        
        print("\n📝 Test Data Created:")
        for key, value in self.test_data.items():
            print(f"   {key}: {value}")

if __name__ == "__main__":
    tester = BusinessJourneyTester()
    tester.run_all_tests()
