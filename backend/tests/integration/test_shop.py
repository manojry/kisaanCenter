"""
Integration tests for Shop APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Shop
def test_create_shop(test_client):
    payload = {
        "owner_id": 1,
        "name": "GreenMart",
        "location": "Delhi"
    }
    response = test_client.post("/shop/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["owner_id"] == payload["owner_id"]
    assert data["name"] == payload["name"]
    assert data["location"] == payload["location"]

# Test: Update Shop
def test_update_shop(test_client):
    payload = {"shop_id": 1, "location": "Mumbai"}
    response = test_client.put("/shop/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["location"] == payload["location"]

# Test: Shop Status
def test_shop_status(test_client):
    response = test_client.get("/shop/status?shop_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

# Test: Edge Cases (invalid, duplicate, etc.)
def test_shop_edge_cases(test_client):
    # Invalid owner_id
    payload = {"owner_id": -1, "name": "GreenMart", "location": "Delhi"}
    response = test_client.post("/shop/create", json=payload)
    assert response.status_code == 400
    # Duplicate shop
    payload = {"owner_id": 1, "name": "GreenMart", "location": "Delhi"}
    test_client.post("/shop/create", json=payload)
    response = test_client.post("/shop/create", json=payload)
    assert response.status_code in (400, 409)
