"""
Integration tests for Farmer Stock APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Add Farmer Stock
def test_add_farmer_stock(test_client):
    payload = {
        "farmer_id": 1,
        "product_id": 2,
        "quantity": 100,
        "unit": "kg"
    }
    response = test_client.post("/farmer_stock/add", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["farmer_id"] == payload["farmer_id"]
    assert data["product_id"] == payload["product_id"]
    assert data["quantity"] == payload["quantity"]
    assert data["unit"] == payload["unit"]

# Test: Update Farmer Stock
def test_update_farmer_stock(test_client):
    payload = {
        "farmer_stock_id": 1,
        "quantity": 150
    }
    response = test_client.put("/farmer_stock/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == payload["quantity"]

# Test: Audit Logging
def test_farmer_stock_audit_log(test_client):
    response = test_client.get("/farmer_stock/audit_log?farmer_stock_id=1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Optionally check for expected audit log fields
    if data:
        assert "action" in data[0]
        assert "timestamp" in data[0]

# Test: Edge Cases (invalid, duplicate, etc.)
def test_farmer_stock_edge_cases(test_client):
    # Invalid quantity
    payload = {
        "farmer_id": 1,
        "product_id": 2,
        "quantity": -10,
        "unit": "kg"
    }
    response = test_client.post("/farmer_stock/add", json=payload)
    assert response.status_code == 400
    # Duplicate entry
    payload = {
        "farmer_id": 1,
        "product_id": 2,
        "quantity": 100,
        "unit": "kg"
    }
    test_client.post("/farmer_stock/add", json=payload)  # First add
    response = test_client.post("/farmer_stock/add", json=payload)  # Duplicate
    assert response.status_code in (400, 409)
