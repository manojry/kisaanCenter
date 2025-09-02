"""
Integration tests for Plan Management APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Plan
def test_create_plan(test_client):
    payload = {
        "name": "Premium",
        "limit": 1000,
        "price": 499.99
    }
    response = test_client.post("/plan/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["limit"] == payload["limit"]
    assert data["price"] == payload["price"]

# Test: Update Plan
def test_update_plan(test_client):
    payload = {
        "plan_id": 1,
        "limit": 2000
    }
    response = test_client.put("/plan/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == payload["limit"]

# Test: Delete Plan
def test_delete_plan(test_client):
    response = test_client.delete("/plan/delete?plan_id=1")
    assert response.status_code == 204

# Test: Enforce Plan Limits
def test_plan_limit_enforcement(test_client):
    # Try to exceed plan limit
    payload = {
        "plan_id": 1,
        "usage": 99999
    }
    response = test_client.post("/plan/use", json=payload)
    assert response.status_code == 400

# Test: Edge Cases (invalid data, duplicate, etc.)
def test_plan_edge_cases(test_client):
    # Invalid price
    payload = {
        "name": "Basic",
        "limit": 100,
        "price": -10
    }
    response = test_client.post("/plan/create", json=payload)
    assert response.status_code == 400
    # Duplicate plan name
    payload = {
        "name": "Premium",
        "limit": 1000,
        "price": 499.99
    }
    test_client.post("/plan/create", json=payload)  # First add
    response = test_client.post("/plan/create", json=payload)  # Duplicate
    assert response.status_code in (400, 409)
