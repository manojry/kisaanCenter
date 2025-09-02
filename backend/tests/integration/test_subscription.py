"""
Integration tests for Subscription APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Subscription
def test_create_subscription(test_client):
    payload = {
        "user_id": 1,
        "plan_id": 2,
        "start_date": "2025-08-01"
    }
    response = test_client.post("/subscription/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == payload["user_id"]
    assert data["plan_id"] == payload["plan_id"]
    assert data["start_date"] == payload["start_date"]

# Test: Update Subscription
def test_update_subscription(test_client):
    payload = {"subscription_id": 1, "plan_id": 3}
    response = test_client.put("/subscription/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["plan_id"] == payload["plan_id"]

# Test: Cancel Subscription
def test_cancel_subscription(test_client):
    response = test_client.post("/subscription/cancel", json={"subscription_id": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"

# Test: Subscription Status
def test_subscription_status(test_client):
    response = test_client.get("/subscription/status?subscription_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

# Test: Edge Cases (invalid, duplicate, etc.)
def test_subscription_edge_cases(test_client):
    # Invalid plan_id
    payload = {"user_id": 1, "plan_id": -1, "start_date": "2025-08-01"}
    response = test_client.post("/subscription/create", json=payload)
    assert response.status_code == 400
    # Duplicate subscription
    payload = {"user_id": 1, "plan_id": 2, "start_date": "2025-08-01"}
    test_client.post("/subscription/create", json=payload)
    response = test_client.post("/subscription/create", json=payload)
    assert response.status_code in (400, 409)
