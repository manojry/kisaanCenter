"""
Integration tests for Credit APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Credit
def test_create_credit(test_client):
    payload = {
        "user_id": 1,
        "amount": 1000,
        "type": "bonus"
    }
    response = test_client.post("/credit/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == payload["user_id"]
    assert data["amount"] == payload["amount"]
    assert data["type"] == payload["type"]

# Test: Update Credit
def test_update_credit(test_client):
    payload = {"credit_id": 1, "amount": 1200}
    response = test_client.put("/credit/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == payload["amount"]

# Test: Credit Status
def test_credit_status(test_client):
    response = test_client.get("/credit/status?credit_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

# Test: Edge Cases (invalid, duplicate, etc.)
def test_credit_edge_cases(test_client):
    # Invalid amount
    payload = {"user_id": 1, "amount": -100, "type": "bonus"}
    response = test_client.post("/credit/create", json=payload)
    assert response.status_code == 400
    # Duplicate credit
    payload = {"user_id": 1, "amount": 1000, "type": "bonus"}
    test_client.post("/credit/create", json=payload)
    response = test_client.post("/credit/create", json=payload)
    assert response.status_code in (400, 409)
