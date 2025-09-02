"""
Comprehensive API Endpoint Tests (FastAPI TestClient)
Tests all main endpoints with business validation
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import os

# Import your FastAPI app
from src.main import app  # Make sure PYTHONPATH includes project root

client = TestClient(app)

class TestAPIEndpoints:
    def test_root_endpoint(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Market Management System API" in data["message"]
        assert data["status"] == "healthy"

    def test_health_check(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "services" in data

    def test_api_info(self):
        resp = client.get("/api/v1/info")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert "endpoints" in data

    def test_create_user(self):
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "password": "testpass123",
            "role": "farmer",
            "shop_id": self.test_data['shop_id'],
            "contact": "+91-9876543210",
            "credit_limit": 10000.0,
            "created_by": self.test_data['user_id'],
            "status": "active"
        }
        resp = client.post("/api/v1/users/", json=user_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        self.test_data['new_user_id'] = data["data"]["id"]

    def test_get_user(self):
        user_id = self.test_data.get('new_user_id') or self.test_data.get('user_id')
        resp = client.get(f"/api/v1/users/{user_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["id"] == user_id

    def test_get_users_list(self):
        resp = client.get("/api/v1/users", params={"page": 1, "limit": 10})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_update_user(self):
        user_id = self.test_data.get('new_user_id') or self.test_data.get('user_id')
        update_data = {"contact": "+91-9876543211", "credit_limit": 15000.0}
        resp = client.put(f"/api/v1/users/{user_id}", json=update_data)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_user_login(self):
        resp = client.post("/api/v1/users/auth/login", params={"username": "reddy", "password": "testpass"})
        assert resp.status_code == 200 or resp.status_code == 401

    def test_get_users_by_shop(self):
        shop_id = self.test_data['shop_id']
        resp = client.get(f"/api/v1/users/shop/{shop_id}")
        assert resp.status_code == 200

    def test_get_product(self):
        product_id = self.test_data['product_id']
        resp = client.get(f"/api/v1/products/{product_id}")
        assert resp.status_code == 200

    def test_get_products_list(self):
        resp = client.get("/api/v1/products", params={"page": 1, "limit": 10})
        assert resp.status_code == 200

    def test_create_transaction(self):
        transaction_data = {
            "shop_id": self.test_data['shop_id'],
            "buyer_id": self.test_data['user_id'],
            "transaction_type": "sale",
            "items": [
                {
                    "product_id": self.test_data['product_id'],
                    "farmer_id": self.test_data['user_id'],
                    "quantity": 10.0,
                    "rate": 50.0
                }
            ],
            "commission_rate": 5.0
        }
        resp = client.post("/api/v1/transactions/", json=transaction_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        self.test_data['transaction_id'] = data["data"]["id"]

    def test_get_transaction(self):
        transaction_id = self.test_data['transaction_id']
        resp = client.get(f"/api/v1/transactions/{transaction_id}")
        assert resp.status_code == 200

    def test_get_transactions_list(self):
        resp = client.get("/api/v1/transactions", params={"page": 1, "limit": 10})
        assert resp.status_code == 200

    def test_update_transaction(self):
        transaction_id = self.test_data['transaction_id']
        update_data = {"commission_rate": 6.0}
        resp = client.put(f"/api/v1/transactions/{transaction_id}", json=update_data)
        assert resp.status_code == 200

    def test_confirm_commission(self):
        transaction_id = self.test_data['transaction_id']
        resp = client.put(f"/api/v1/transactions/{transaction_id}/confirm-commission", params={"confirmed_by_id": self.test_data['user_id']})
        assert resp.status_code == 200

    def test_transaction_summary(self):
        transaction_id = self.test_data['transaction_id']
        resp = client.get(f"/api/v1/transactions/{transaction_id}/summary")
        assert resp.status_code == 200

    def test_shop_dashboard(self):
        shop_id = self.test_data['shop_id']
        resp = client.get(f"/api/v1/transactions/shop/{shop_id}/dashboard")
        assert resp.status_code == 200

    def test_shop_dashboard_summary(self):
        shop_id = self.test_data['shop_id']
        resp = client.get(f"/api/v1/dashboard/shop/{shop_id}/summary")
        assert resp.status_code == 200
    test_data = {}

    @classmethod
    def setup_class(cls):
        """Setup test data for all endpoint tests"""
        cls.test_data = {}
        print("\n--- Setting up test data ---")
        # Authenticate as superadmin (simulate login)
        login_resp = client.post("/api/v1/users/auth/login", params={"username": "superadmin", "password": "admin123"})
        assert login_resp.status_code == 200, f"Failed to authenticate superadmin: {login_resp.text}"
        auth_data = login_resp.json()["data"]
        user_id = auth_data.get('user_id') or auth_data.get('id', 'unknown')
        cls.test_data['shop_id'] = 1
        cls.test_data['user_id'] = user_id
        # Setup test product
        prod_resp = client.post("/api/v1/products/", json={"name": "Test Product", "category_id": 1, "price": 100.0, "status": "active"})
