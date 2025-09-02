"""
Integration tests for Payment APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Payment
def test_create_payment(test_client):
    payload = {
        "farmer_id": 1,
        "amount": 500,
        "method": "bank_transfer"
    }
    response = test_client.post("/payment/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["farmer_id"] == payload["farmer_id"]
    assert data["amount"] == payload["amount"]
    assert data["method"] == payload["method"]

# Test: Update Payment
def test_update_payment(test_client):
    payload = {"payment_id": 1, "amount": 600}
    response = test_client.put("/payment/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == payload["amount"]

# Test: Payment Status
def test_payment_status(test_client):
    response = test_client.get("/payment/status?payment_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

# Test: Edge Cases (invalid, duplicate, etc.)
def test_payment_edge_cases(test_client):
    # Invalid amount
    payload = {"farmer_id": 1, "amount": -50, "method": "bank_transfer"}
    response = test_client.post("/payment/create", json=payload)
    assert response.status_code == 400
    # Duplicate payment
    payload = {"farmer_id": 1, "amount": 500, "method": "bank_transfer"}
    test_client.post("/payment/create", json=payload)
    response = test_client.post("/payment/create", json=payload)
    assert response.status_code in (400, 409)
