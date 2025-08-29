
import pytest
from fastapi.testclient import TestClient

class TestUserAPI:
    def test_create_user_success(self, client, sample_user_data):
        """Test successful user creation"""
        response = client.post("/users", json=sample_user_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == sample_user_data["username"]
        assert "password" not in data["data"]  # Password should not be returned
    
    def test_create_user_duplicate_username(self, client, sample_user_data):
        """Test user creation with duplicate username"""
        # Create first user
        client.post("/users", json=sample_user_data)
        
        # Try to create duplicate
        response = client.post("/users", json=sample_user_data)
        assert response.status_code == 400
        
        data = response.json()
        assert data["success"] is False
        assert "username already exists" in data["message"].lower()
    
    def test_get_user_by_id(self, client, sample_user_data):
        """Test retrieving user by ID"""
        # Create user
        create_response = client.post("/users", json=sample_user_data)
        user_id = create_response.json()["data"]["id"]
        
        # Get user
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == user_id
    
    def test_get_user_not_found(self, client):
        """Test retrieving non-existent user"""
        response = client.get("/users/999")
        assert response.status_code == 404
        
        data = response.json()
        assert data["success"] is False

class TestTransactionAPI:
    def test_create_transaction_success(self, client, sample_transaction_data):
        """Test successful transaction creation"""
        response = client.post("/transactions", json=sample_transaction_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "PENDING"
    
    def test_complete_transaction(self, client, sample_transaction_data):
        """Test transaction completion workflow"""
        # Create transaction
        create_response = client.post("/transactions", json=sample_transaction_data)
        transaction_id = create_response.json()["data"]["id"]
        
        # Mark buyer payment complete
        response = client.put(
            f"/transactions/{transaction_id}/buyer-payment",
            json={"buyer_payment_complete": True}
        )
        assert response.status_code == 200
        
        # Mark farmer payment complete
        response = client.put(
            f"/transactions/{transaction_id}/farmer-payment",
            json={"farmer_payment_complete": True}
        )
        assert response.status_code == 200
        
        # Confirm commission
        response = client.put(
            f"/transactions/{transaction_id}/commission",
            json={"commission_confirmed": True}
        )
        assert response.status_code == 200
        
        # Check transaction is completed
        response = client.get(f"/transactions/{transaction_id}")
        data = response.json()
        assert data["data"]["completion_status"] == "COMPLETE"
        assert data["data"]["status"] == "COMPLETED"
