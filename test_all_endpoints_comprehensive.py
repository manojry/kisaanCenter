#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script for KisaanCenter

This script tests all API endpoints with realistic dummy data.
It will:
1. Test basic health endpoints
2. Create dummy users, shops, products
3. Test subscription management endpoints
4. Test super admin endpoints
5. Test transaction flows
6. Generate comprehensive reports

Usage: python test_all_endpoints_comprehensive.py
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

class Color:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_entities = {
            'users': [],
            'shops': [],
            'products': [],
            'transactions': [],
            'plans': [],
            'subscriptions': []
        }
        
    def log_test(self, test_name: str, success: bool, response: Any = None, error: str = None):
        """Log test results"""
        status = f"{Color.GREEN}✅ PASS{Color.END}" if success else f"{Color.RED}❌ FAIL{Color.END}"
        print(f"{status} {test_name}")
        
        if error:
            print(f"    {Color.RED}Error: {error}{Color.END}")
        elif response and hasattr(response, 'status_code'):
            print(f"    {Color.BLUE}Status: {response.status_code}{Color.END}")
            
        self.test_results.append({
            'test': test_name,
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'error': error
        })

    def test_health_endpoints(self):
        """Test basic health and info endpoints"""
        print(f"\n{Color.BOLD}{Color.CYAN}🏥 Testing Health Endpoints{Color.END}")
        
        # Test main health endpoint
        try:
            response = self.session.get(f"{BASE_URL}/health")
            self.log_test("GET /health", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /health", False, error=str(e))

        # Test API info
        try:
            response = self.session.get(f"{API_V1}/info")
            self.log_test("GET /api/v1/info", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /api/v1/info", False, error=str(e))

        # Test subscription health
        try:
            response = self.session.get(f"{API_V1}/subscriptions/health")
            self.log_test("GET /api/v1/subscriptions/health", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /api/v1/subscriptions/health", False, error=str(e))

    def create_dummy_plans(self):
        """Create subscription plans"""
        print(f"\n{Color.BOLD}{Color.PURPLE}📋 Creating Subscription Plans{Color.END}")
        
        plans = [
            {
                "name": "Basic Plan",
                "description": "Perfect for small shops starting their journey",
                "monthly_price": 49.99,
                "quarterly_price": 134.99,
                "yearly_price": 509.99,
                "max_farmers": 10,
                "max_buyers": 25,
                "data_retention_months": 6,
                "features": ["basic_analytics", "farmer_management", "buyer_management"]
            },
            {
                "name": "Premium Plan", 
                "description": "Advanced features for growing businesses",
                "monthly_price": 99.99,
                "quarterly_price": 269.99,
                "yearly_price": 1019.99,
                "max_farmers": 50,
                "max_buyers": 100,
                "data_retention_months": 12,
                "features": ["advanced_analytics", "farmer_management", "buyer_management", "inventory_management"]
            },
            {
                "name": "Enterprise Plan",
                "description": "Complete solution for large operations",
                "monthly_price": 199.99,
                "quarterly_price": 539.99,
                "yearly_price": 2039.99,
                "max_farmers": 200,
                "max_buyers": 500,
                "data_retention_months": 24,
                "features": ["premium_analytics", "farmer_management", "buyer_management", "inventory_management", "custom_reports"]
            }
        ]
        
        for plan_data in plans:
            try:
                response = self.session.post(f"{API_V1}/subscriptions/plans", json=plan_data)
                if response.status_code in [200, 201]:
                    plan = response.json()
                    self.created_entities['plans'].append(plan)
                    self.log_test(f"Create Plan: {plan_data['name']}", True, response)
                else:
                    self.log_test(f"Create Plan: {plan_data['name']}", False, response)
            except Exception as e:
                self.log_test(f"Create Plan: {plan_data['name']}", False, error=str(e))

    def create_dummy_users_and_shops(self):
        """Create dummy users and shops"""
        print(f"\n{Color.BOLD}{Color.BLUE}👥 Creating Users and Shops{Color.END}")
        
        # Create shops with owners
        shops_data = [
            {
                "name": "Green Valley Farm Market",
                "location": "Mumbai, Maharashtra",
                "contact_number": "+91-9876543210",
                "owner": {
                    "username": "ramesh_owner",
                    "email": "ramesh@greenvalley.com",
                    "password": "secure123",
                    "full_name": "Ramesh Kumar",
                    "phone": "+91-9876543210",
                    "role": "OWNER"
                }
            },
            {
                "name": "Golden Harvest Center",
                "location": "Pune, Maharashtra", 
                "contact_number": "+91-9876543211",
                "owner": {
                    "username": "priya_owner",
                    "email": "priya@goldenharvest.com",
                    "password": "secure123",
                    "full_name": "Priya Sharma",
                    "phone": "+91-9876543211",
                    "role": "OWNER"
                }
            },
            {
                "name": "Fresh Fields Marketplace",
                "location": "Bangalore, Karnataka",
                "contact_number": "+91-9876543212", 
                "owner": {
                    "username": "amit_owner",
                    "email": "amit@freshfields.com",
                    "password": "secure123",
                    "full_name": "Amit Patel",
                    "phone": "+91-9876543212",
                    "role": "OWNER"
                }
            }
        ]
        
        for shop_data in shops_data:
            try:
                # Create user first
                user_data = shop_data.pop("owner")
                response = self.session.post(f"{API_V1}/users", json=user_data)
                if response.status_code in [200, 201]:
                    user = response.json()
                    self.created_entities['users'].append(user)
                    self.log_test(f"Create Owner: {user_data['full_name']}", True, response)
                    
                    # Create shop
                    shop_data["owner_id"] = user.get("id")
                    response = self.session.post(f"{API_V1}/shops", json=shop_data)
                    if response.status_code in [200, 201]:
                        shop = response.json()
                        self.created_entities['shops'].append(shop)
                        self.log_test(f"Create Shop: {shop_data['name']}", True, response)
                    else:
                        self.log_test(f"Create Shop: {shop_data['name']}", False, response)
                else:
                    self.log_test(f"Create Owner: {user_data['full_name']}", False, response)
            except Exception as e:
                self.log_test(f"Create Shop/Owner", False, error=str(e))

        # Create farmers and buyers for each shop
        self.create_farmers_and_buyers()

    def create_farmers_and_buyers(self):
        """Create farmers and buyers for existing shops"""
        print(f"\n{Color.BOLD}{Color.GREEN}🌾 Creating Farmers and Buyers{Color.END}")
        
        farmer_names = [
            ("Suresh", "Reddy", "+91-9123456789", "suresh.reddy"),
            ("Lakshmi", "Devi", "+91-9123456790", "lakshmi.devi"),
            ("Ravi", "Kumar", "+91-9123456791", "ravi.kumar"),
            ("Meera", "Patel", "+91-9123456792", "meera.patel"),
            ("Arjun", "Singh", "+91-9123456793", "arjun.singh")
        ]
        
        buyer_names = [
            ("Rajesh", "Wholesale Co", "+91-9987654321", "rajesh.wholesale"),
            ("Sita", "Retail Mart", "+91-9987654322", "sita.retail"),
            ("Dinesh", "Export House", "+91-9987654323", "dinesh.export"),
            ("Kavitha", "Local Market", "+91-9987654324", "kavitha.local"),
            ("Venkat", "Online Foods", "+91-9987654325", "venkat.online")
        ]
        
        for shop in self.created_entities['shops']:
            shop_id = shop.get('id')
            
            # Create farmers for this shop
            for i, (fname, lname, phone, username) in enumerate(farmer_names[:3]):  # 3 farmers per shop
                farmer_data = {
                    "username": f"{username}_shop{shop_id}",
                    "email": f"{username}@shop{shop_id}.com",
                    "password": "farmer123",
                    "full_name": f"{fname} {lname}",
                    "phone": phone,
                    "role": "FARMER",
                    "shop_id": shop_id
                }
                
                try:
                    response = self.session.post(f"{API_V1}/users", json=farmer_data)
                    if response.status_code in [200, 201]:
                        farmer = response.json()
                        self.created_entities['users'].append(farmer)
                        self.log_test(f"Create Farmer: {farmer_data['full_name']}", True, response)
                    else:
                        self.log_test(f"Create Farmer: {farmer_data['full_name']}", False, response)
                except Exception as e:
                    self.log_test(f"Create Farmer: {farmer_data['full_name']}", False, error=str(e))
            
            # Create buyers for this shop
            for i, (fname, company, phone, username) in enumerate(buyer_names[:4]):  # 4 buyers per shop
                buyer_data = {
                    "username": f"{username}_shop{shop_id}",
                    "email": f"{username}@shop{shop_id}.com",
                    "password": "buyer123",
                    "full_name": f"{fname} - {company}",
                    "phone": phone,
                    "role": "BUYER",
                    "shop_id": shop_id
                }
                
                try:
                    response = self.session.post(f"{API_V1}/users", json=buyer_data)
                    if response.status_code in [200, 201]:
                        buyer = response.json()
                        self.created_entities['users'].append(buyer)
                        self.log_test(f"Create Buyer: {buyer_data['full_name']}", True, response)
                    else:
                        self.log_test(f"Create Buyer: {buyer_data['full_name']}", False, response)
                except Exception as e:
                    self.log_test(f"Create Buyer: {buyer_data['full_name']}", False, error=str(e))

    def create_dummy_products(self):
        """Create products for farmers"""
        print(f"\n{Color.BOLD}{Color.YELLOW}🥕 Creating Products{Color.END}")
        
        products_data = [
            {"name": "Organic Tomatoes", "category": "Vegetables", "unit": "kg", "description": "Fresh organic tomatoes"},
            {"name": "Basmati Rice", "category": "Grains", "unit": "kg", "description": "Premium quality basmati rice"},
            {"name": "Fresh Onions", "category": "Vegetables", "unit": "kg", "description": "Red onions from local farm"},
            {"name": "Green Chilies", "category": "Spices", "unit": "kg", "description": "Hot green chilies"},
            {"name": "Wheat Flour", "category": "Grains", "unit": "kg", "description": "Whole wheat flour"},
            {"name": "Fresh Potatoes", "category": "Vegetables", "unit": "kg", "description": "Farm fresh potatoes"},
            {"name": "Turmeric Powder", "category": "Spices", "unit": "kg", "description": "Pure turmeric powder"},
            {"name": "Fresh Carrots", "category": "Vegetables", "unit": "kg", "description": "Orange carrots"},
        ]
        
        # Get farmers to assign products to
        farmers = [user for user in self.created_entities['users'] if user.get('role') == 'FARMER']
        
        for farmer in farmers:
            # Each farmer gets 3-5 random products
            farmer_products = random.sample(products_data, random.randint(3, 5))
            
            for product_data in farmer_products:
                product_data_with_farmer = {
                    **product_data,
                    "farmer_id": farmer.get('id'),
                    "shop_id": farmer.get('shop_id'),
                    "base_price": round(random.uniform(20, 200), 2),
                    "available_quantity": random.randint(50, 500)
                }
                
                try:
                    response = self.session.post(f"{API_V1}/products", json=product_data_with_farmer)
                    if response.status_code in [200, 201]:
                        product = response.json()
                        self.created_entities['products'].append(product)
                        self.log_test(f"Create Product: {product_data['name']} (Farmer: {farmer.get('full_name')})", True, response)
                    else:
                        self.log_test(f"Create Product: {product_data['name']}", False, response)
                except Exception as e:
                    self.log_test(f"Create Product: {product_data['name']}", False, error=str(e))

    def test_subscription_endpoints(self):
        """Test subscription management endpoints"""
        print(f"\n{Color.BOLD}{Color.PURPLE}💳 Testing Subscription Endpoints{Color.END}")
        
        # Test getting all plans
        try:
            response = self.session.get(f"{API_V1}/subscriptions/plans")
            self.log_test("GET /subscriptions/plans", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /subscriptions/plans", False, error=str(e))

        # Create subscriptions for shops
        if self.created_entities['shops'] and self.created_entities['plans']:
            for i, shop in enumerate(self.created_entities['shops']):
                plan = self.created_entities['plans'][i % len(self.created_entities['plans'])]
                
                subscription_data = {
                    "shop_id": shop.get('id'),
                    "plan_id": plan.get('id'),
                    "billing_cycle": "MONTHLY"
                }
                
                try:
                    response = self.session.post(f"{API_V1}/subscriptions", json=subscription_data)
                    if response.status_code in [200, 201]:
                        subscription = response.json()
                        self.created_entities['subscriptions'].append(subscription)
                        self.log_test(f"Create Subscription for {shop.get('name')}", True, response)
                    else:
                        self.log_test(f"Create Subscription for {shop.get('name')}", False, response)
                except Exception as e:
                    self.log_test(f"Create Subscription for {shop.get('name')}", False, error=str(e))

        # Test subscription analytics
        if self.created_entities['subscriptions']:
            try:
                response = self.session.get(f"{API_V1}/subscriptions/analytics/overview")
                self.log_test("GET /subscriptions/analytics/overview", response.status_code == 200, response)
            except Exception as e:
                self.log_test("GET /subscriptions/analytics/overview", False, error=str(e))

    def test_super_admin_endpoints(self):
        """Test super admin endpoints"""
        print(f"\n{Color.BOLD}{Color.RED}🔧 Testing Super Admin Endpoints{Color.END}")
        
        # Test shop analytics
        try:
            response = self.session.get(f"{API_V1}/admin/analytics/shops-overview")
            self.log_test("GET /admin/analytics/shops-overview", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /admin/analytics/shops-overview", False, error=str(e))

        # Test risk assessment for a shop
        if self.created_entities['shops']:
            shop_id = self.created_entities['shops'][0].get('id')
            try:
                response = self.session.get(f"{API_V1}/admin/analytics/shop-risk-assessment/{shop_id}")
                self.log_test(f"GET /admin/analytics/shop-risk-assessment/{shop_id}", response.status_code == 200, response)
            except Exception as e:
                self.log_test(f"GET /admin/analytics/shop-risk-assessment/{shop_id}", False, error=str(e))

        # Test plan override for a shop
        if self.created_entities['shops']:
            shop_id = self.created_entities['shops'][0].get('id')
            override_data = {
                "overrides": {
                    "max_farmers": 15,
                    "monthly_price": 79.99,
                    "discount_quarterly": 10
                },
                "reason": "Testing override functionality",
                "valid_until": "2025-12-31"
            }
            
            try:
                response = self.session.put(f"{API_V1}/admin/shops/{shop_id}/plan-overrides", json=override_data)
                self.log_test(f"PUT /admin/shops/{shop_id}/plan-overrides", response.status_code in [200, 201], response)
            except Exception as e:
                self.log_test(f"PUT /admin/shops/{shop_id}/plan-overrides", False, error=str(e))

    def create_dummy_transactions(self):
        """Create dummy transactions"""
        print(f"\n{Color.BOLD}{Color.CYAN}💰 Creating Transactions{Color.END}")
        
        if not self.created_entities['products']:
            print("No products available for transactions")
            return
            
        buyers = [user for user in self.created_entities['users'] if user.get('role') == 'BUYER']
        
        for _ in range(10):  # Create 10 transactions
            if not buyers or not self.created_entities['products']:
                break
                
            buyer = random.choice(buyers)
            product = random.choice(self.created_entities['products'])
            
            # Only create transaction if buyer and product are from same shop
            if buyer.get('shop_id') == product.get('shop_id'):
                quantity = random.randint(5, 50)
                price_per_unit = round(random.uniform(25, 150), 2)
                
                transaction_data = {
                    "buyer_id": buyer.get('id'),
                    "farmer_id": product.get('farmer_id'),
                    "product_id": product.get('id'),
                    "shop_id": product.get('shop_id'),
                    "quantity": quantity,
                    "price_per_unit": price_per_unit,
                    "total_amount": round(quantity * price_per_unit, 2),
                    "transaction_type": "SALE"
                }
                
                try:
                    response = self.session.post(f"{API_V1}/transactions", json=transaction_data)
                    if response.status_code in [200, 201]:
                        transaction = response.json()
                        self.created_entities['transactions'].append(transaction)
                        self.log_test(f"Create Transaction: {buyer.get('full_name')} -> {product.get('name')}", True, response)
                    else:
                        self.log_test(f"Create Transaction", False, response)
                except Exception as e:
                    self.log_test(f"Create Transaction", False, error=str(e))

    def test_crud_operations(self):
        """Test CRUD operations on various entities"""
        print(f"\n{Color.BOLD}{Color.WHITE}🔄 Testing CRUD Operations{Color.END}")
        
        # Test getting users
        try:
            response = self.session.get(f"{API_V1}/users")
            self.log_test("GET /users", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /users", False, error=str(e))

        # Test getting shops
        try:
            response = self.session.get(f"{API_V1}/shops")
            self.log_test("GET /shops", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /shops", False, error=str(e))

        # Test getting products
        try:
            response = self.session.get(f"{API_V1}/products")
            self.log_test("GET /products", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /products", False, error=str(e))

        # Test getting transactions
        try:
            response = self.session.get(f"{API_V1}/transactions")
            self.log_test("GET /transactions", response.status_code == 200, response)
        except Exception as e:
            self.log_test("GET /transactions", False, error=str(e))

        # Test specific entity by ID
        if self.created_entities['users']:
            user_id = self.created_entities['users'][0].get('id')
            try:
                response = self.session.get(f"{API_V1}/users/{user_id}")
                self.log_test(f"GET /users/{user_id}", response.status_code == 200, response)
            except Exception as e:
                self.log_test(f"GET /users/{user_id}", False, error=str(e))

    def generate_summary_report(self):
        """Generate a comprehensive summary report"""
        print(f"\n{Color.BOLD}{Color.CYAN}📊 COMPREHENSIVE TEST SUMMARY{Color.END}")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"{Color.BOLD}Overall Results:{Color.END}")
        print(f"  Total Tests: {total_tests}")
        print(f"  {Color.GREEN}Passed: {passed_tests}{Color.END}")
        print(f"  {Color.RED}Failed: {failed_tests}{Color.END}")
        print(f"  Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\n{Color.BOLD}Created Entities:{Color.END}")
        for entity_type, entities in self.created_entities.items():
            print(f"  {entity_type.title()}: {len(entities)}")
            
        print(f"\n{Color.BOLD}Entity Details:{Color.END}")
        
        # Shop details
        if self.created_entities['shops']:
            print(f"\n{Color.BLUE}🏪 Shops:{Color.END}")
            for shop in self.created_entities['shops']:
                print(f"  • {shop.get('name')} (ID: {shop.get('id')}) - {shop.get('location')}")
        
        # Plan details
        if self.created_entities['plans']:
            print(f"\n{Color.PURPLE}📋 Subscription Plans:{Color.END}")
            for plan in self.created_entities['plans']:
                print(f"  • {plan.get('name')} - ₹{plan.get('monthly_price')}/month")
        
        # User breakdown
        if self.created_entities['users']:
            users_by_role = {}
            for user in self.created_entities['users']:
                role = user.get('role', 'UNKNOWN')
                if role not in users_by_role:
                    users_by_role[role] = 0
                users_by_role[role] += 1
            
            print(f"\n{Color.GREEN}👥 Users by Role:{Color.END}")
            for role, count in users_by_role.items():
                print(f"  • {role}: {count}")
        
        # Transaction summary
        if self.created_entities['transactions']:
            total_amount = sum(t.get('total_amount', 0) for t in self.created_entities['transactions'])
            print(f"\n{Color.CYAN}💰 Transaction Summary:{Color.END}")
            print(f"  • Total Transactions: {len(self.created_entities['transactions'])}")
            print(f"  • Total Value: ₹{total_amount:.2f}")
        
        if failed_tests > 0:
            print(f"\n{Color.RED}❌ Failed Tests:{Color.END}")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result.get('error', 'Unknown error')}")
        
        print(f"\n{Color.BOLD}🎯 API Endpoints Tested:{Color.END}")
        endpoints = set()
        for result in self.test_results:
            if "GET /" in result['test'] or "POST /" in result['test'] or "PUT /" in result['test']:
                endpoints.add(result['test'].split(": ")[0] if ": " in result['test'] else result['test'])
        
        for endpoint in sorted(endpoints):
            print(f"  • {endpoint}")
        
        print("\n" + "=" * 80)
        print(f"{Color.BOLD}{Color.GREEN}✅ Comprehensive API testing completed!{Color.END}")
        print(f"{Color.BOLD}🌐 Application running at: {BASE_URL}{Color.END}")
        print(f"{Color.BOLD}📚 API Documentation: {BASE_URL}/docs{Color.END}")
        print(f"{Color.BOLD}📋 Interactive API: {BASE_URL}/redoc{Color.END}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"{Color.BOLD}{Color.CYAN}🚀 KisaanCenter Comprehensive API Testing{Color.END}")
        print(f"{Color.BOLD}Testing API at: {BASE_URL}{Color.END}")
        print("=" * 80)
        
        try:
            # Run all test suites
            self.test_health_endpoints()
            self.create_dummy_plans()
            self.create_dummy_users_and_shops()
            self.create_dummy_products()
            self.test_subscription_endpoints()
            self.test_super_admin_endpoints()
            self.create_dummy_transactions()
            self.test_crud_operations()
            
            # Generate summary
            self.generate_summary_report()
            
        except KeyboardInterrupt:
            print(f"\n{Color.YELLOW}⚠️  Testing interrupted by user{Color.END}")
        except Exception as e:
            print(f"\n{Color.RED}💥 Unexpected error: {str(e)}{Color.END}")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
