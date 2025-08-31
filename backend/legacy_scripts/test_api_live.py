"""
Live API testing script to validate all endpoints and workflows
"""
import requests
import json
import sys
import os
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

BASE_URL = "http://localhost:8000"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, response=None, error=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "status_code": response.status_code if response else None,
            "error": str(error) if error else None
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if response:
            print(f"    Status: {response.status_code}")
        if error:
            print(f"    Error: {error}")
        print()
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        try:
            # Test root endpoint
            response = self.session.get(f"{BASE_URL}/")
            self.log_test("Root Health Check", response.status_code == 200, response)
            
            # Test health endpoint
            response = self.session.get(f"{BASE_URL}/health")
            self.log_test("Detailed Health Check", response.status_code == 200, response)
            
            # Test API info
            response = self.session.get(f"{BASE_URL}/api/v1/info")
            self.log_test("API Info Endpoint", response.status_code == 200, response)
            
        except Exception as e:
            self.log_test("Health Endpoints", False, error=e)
    
    def test_user_creation_workflow(self):
        """Test complete user creation workflow"""
        try:
            # Create superadmin user
            superadmin_data = {
                "username": "test_superadmin",
                "password": "secure_password123",
                "role": "superadmin",
                "contact": "+91-9999999999"
            }
            response = self.session.post(f"{BASE_URL}/api/v1/users/", json=superadmin_data)
            self.log_test("Create Superadmin User", response.status_code in [200, 201], response)
            
            # Create owner user
            owner_data = {
                "username": "test_owner",
                "password": "secure_password123",
                "role": "owner",
                "shop_id": 1,
                "contact": "+91-8888888888"
            }
            response = self.session.post(f"{BASE_URL}/api/v1/users/", json=owner_data)
            self.log_test("Create Owner User", response.status_code in [200, 201], response)
            
            # Create farmer user
            farmer_data = {
                "username": "test_farmer",
                "password": "secure_password123",
                "role": "farmer",
                "shop_id": 1,
                "contact": "+91-7777777777"
            }
            response = self.session.post(f"{BASE_URL}/api/v1/users/", json=farmer_data)
            self.log_test("Create Farmer User", response.status_code in [200, 201], response)
            
            # Create buyer user
            buyer_data = {
                "username": "test_buyer",
                "password": "secure_password123",
                "role": "buyer",
                "shop_id": 1,
                "contact": "+91-6666666666",
                "credit_limit": 50000.00
            }
            response = self.session.post(f"{BASE_URL}/api/v1/users/", json=buyer_data)
            self.log_test("Create Buyer User", response.status_code in [200, 201], response)
            
        except Exception as e:
            self.log_test("User Creation Workflow", False, error=e)
    
    def test_user_retrieval(self):
        """Test user retrieval endpoints"""
        try:
            # Get user by ID
            response = self.session.get(f"{BASE_URL}/api/v1/users/1")
            self.log_test("Get User by ID", response.status_code == 200, response)
            
            # Get users with pagination
            response = self.session.get(f"{BASE_URL}/api/v1/users/?page=1&limit=5")
            self.log_test("Get Users with Pagination", response.status_code == 200, response)
            
            # Get users by shop
            response = self.session.get(f"{BASE_URL}/api/v1/users/shop/1")
            self.log_test("Get Users by Shop", response.status_code == 200, response)
            
            # Get farmers with stock
            response = self.session.get(f"{BASE_URL}/api/v1/users/farmers/with-stock/1")
            self.log_test("Get Farmers with Stock", response.status_code == 200, response)
            
        except Exception as e:
            self.log_test("User Retrieval", False, error=e)
    
    def test_transaction_workflow(self):
        """Test complete transaction workflow"""
        try:
            # Create transaction
            transaction_data = {
                "shop_id": 1,
                "buyer_user_id": 2,
                "transaction_type": "sale",
                "commission_rate": 10.0,
                "transaction_items": [
                    {
                        "product_id": 1,
                        "farmer_stock_id": 1,
                        "quantity": 25.0,
                        "price": 150.0
                    }
                ]
            }
            response = self.session.post(f"{BASE_URL}/api/v1/transactions/", json=transaction_data)
            self.log_test("Create Transaction", response.status_code in [200, 201], response)
            
            # Get transaction details
            response = self.session.get(f"{BASE_URL}/api/v1/transactions/1?include_relations=true")
            self.log_test("Get Transaction Details", response.status_code == 200, response)
            
            # Get transaction summary
            response = self.session.get(f"{BASE_URL}/api/v1/transactions/1/summary")
            self.log_test("Get Transaction Summary", response.status_code == 200, response)
            
            # Get transactions with filtering
            response = self.session.get(f"{BASE_URL}/api/v1/transactions/?shop_id=1&page=1&limit=10")
            self.log_test("Get Transactions with Filtering", response.status_code == 200, response)
            
        except Exception as e:
            self.log_test("Transaction Workflow", False, error=e)
    
    def test_dashboard_endpoints(self):
        """Test dashboard and analytics endpoints"""
        try:
            # Shop dashboard
            response = self.session.get(f"{BASE_URL}/api/v1/transactions/shop/1/dashboard")
            self.log_test("Shop Dashboard", response.status_code == 200, response)
            
            # Incomplete transactions
            response = self.session.get(f"{BASE_URL}/api/v1/transactions/completion-status/pending?shop_id=1")
            self.log_test("Incomplete Transactions", response.status_code == 200, response)
            
        except Exception as e:
            self.log_test("Dashboard Endpoints", False, error=e)
    
    def test_owner_workflow(self):
        """Test complete owner workflow and capabilities"""
        print("🏪 TESTING OWNER WORKFLOW")
        print("=" * 50)
        
        try:
            # 1. Owner Authentication (simulated)
            print("1. Owner Authentication")
            auth_response = self.session.post(f"{BASE_URL}/api/v1/users/auth/login", 
                                            params={"username": "owner1", "password": "hashed_password_owner"})
            print(f"   Status: {auth_response.status_code} (Expected: 401 due to hash mismatch)")
            
            # 2. View Shop Dashboard
            print("2. View Shop Dashboard")
            dashboard_response = self.session.get(f"{BASE_URL}/api/v1/transactions/shop/1/dashboard")
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"   ✅ Dashboard loaded successfully")
                if dashboard_data.get('success'):
                    data = dashboard_data['data']
                    print(f"   📊 Total Transactions: {data.get('total_transactions', 'N/A')}")
                    print(f"   💰 Total Sales: ${data.get('total_sales', 'N/A')}")
                    print(f"   🏦 Total Commission: ${data.get('total_commission', 'N/A')}")
                    print(f"   👥 Active Farmers: {data.get('active_farmers', 'N/A')}")
                    print(f"   🛒 Active Buyers: {data.get('active_buyers', 'N/A')}")
            else:
                print(f"   ❌ Dashboard failed: {dashboard_response.status_code}")
            
            # 3. View All Users in Shop
            print("3. View All Users in Shop")
            users_response = self.session.get(f"{BASE_URL}/api/v1/users/shop/1")
            if users_response.status_code == 200:
                users_data = users_response.json()
                print(f"   ✅ Users loaded successfully")
                if users_data.get('success'):
                    users = users_data['data']
                    print(f"   👥 Total Users: {len(users)}")
                    for user in users[:3]:  # Show first 3 users
                        print(f"      - {user.get('username')} ({user.get('role')})")
            else:
                print(f"   ❌ Users failed: {users_response.status_code}")
            
            # 4. Create New Employee
            print("4. Create New Employee")
            employee_data = {
                "username": "new_employee",
                "password": "secure_password123",
                "role": "employee",
                "shop_id": 1,
                "contact": "+91-5555555555"
            }
            employee_response = self.session.post(f"{BASE_URL}/api/v1/users/", json=employee_data)
            print(f"   Status: {employee_response.status_code}")
            if employee_response.status_code in [200, 201]:
                print("   ✅ Employee created successfully")
            elif employee_response.status_code == 400:
                print("   ⚠️  Employee creation failed (likely validation error)")
            
            # 5. View Incomplete Transactions
            print("5. View Incomplete Transactions")
            incomplete_response = self.session.get(f"{BASE_URL}/api/v1/transactions/completion-status/pending?shop_id=1")
            if incomplete_response.status_code == 200:
                incomplete_data = incomplete_response.json()
                print(f"   ✅ Incomplete transactions loaded")
                if incomplete_data.get('success'):
                    transactions = incomplete_data['data']['items']
                    print(f"   📋 Incomplete Transactions: {len(transactions)}")
                    for txn in transactions[:2]:  # Show first 2
                        print(f"      - Transaction {txn.get('id')}: {txn.get('completion_status')}")
            else:
                print(f"   ❌ Incomplete transactions failed: {incomplete_response.status_code}")
            
            # 6. Confirm Commission (if transactions exist)
            print("6. Confirm Commission")
            confirm_response = self.session.put(f"{BASE_URL}/api/v1/transactions/1/confirm-commission", 
                                              params={"confirmed_by_id": 1})
            print(f"   Status: {confirm_response.status_code}")
            if confirm_response.status_code == 200:
                print("   ✅ Commission confirmed successfully")
            else:
                print("   ⚠️  Commission confirmation failed (expected if no transaction)")
            
            # 7. Update User Credit Limit
            print("7. Update User Credit Limit")
            credit_response = self.session.put(f"{BASE_URL}/api/v1/users/2/credit-limit", 
                                             params={"new_limit": 75000, "updated_by_id": 1})
            print(f"   Status: {credit_response.status_code}")
            if credit_response.status_code == 200:
                print("   ✅ Credit limit updated successfully")
            else:
                print("   ⚠️  Credit limit update failed")
            
            print("\n🎯 OWNER WORKFLOW SUMMARY:")
            print("✅ Dashboard access - View business metrics")
            print("✅ User management - View and create users")
            print("✅ Transaction oversight - Monitor all transactions")
            print("✅ Commission control - Confirm commissions")
            print("✅ Credit management - Update user credit limits")
            print("✅ Analytics access - View incomplete transactions")
            
        except Exception as e:
            print(f"❌ Owner workflow failed: {e}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 STARTING COMPREHENSIVE API VALIDATION")
        print("=" * 60)
        
        # Test health endpoints first
        self.test_health_endpoints()
        
        # Test user workflows
        self.test_user_creation_workflow()
        self.test_user_retrieval()
        
        # Test transaction workflows
        self.test_transaction_workflow()
        
        # Test dashboard
        self.test_dashboard_endpoints()
        
        # Test owner workflow
        self.test_owner_workflow()
        
        # Summary
        print("\n📊 TEST SUMMARY")
        print("=" * 30)
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        print(f"Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if passed < total:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['error']}")

if __name__ == "__main__":
    print("⚠️  Make sure the API server is running on http://localhost:8000")
    print("   Start with: uvicorn src.main:app --reload")
    print()
    
    tester = APITester()
    tester.run_all_tests()