"""
Integration tests for Transaction Flow APIs
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

# Test: Create Transaction
def test_create_transaction(test_client):
    payload = {
        "farmer_id": 1,
        "amount": 1000,
        "type": "sale"
    }
    response = test_client.post("/transaction/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["farmer_id"] == payload["farmer_id"]
    assert data["amount"] == payload["amount"]
    assert data["type"] == payload["type"]

# Test: Confirm Commission
def test_confirm_commission(test_client):
    payload = {"transaction_id": 1}
    response = test_client.post("/transaction/confirm_commission", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["commission_confirmed"] is True

# Test: Update Farmer Payment
def test_update_farmer_payment(test_client):
    payload = {"transaction_id": 1, "payment_status": "paid"}
    response = test_client.put("/transaction/update_payment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["payment_status"] == "paid"

# Test: Audit Log Retrieval
def test_get_transaction_audit_log(test_client):
    response = test_client.get("/transaction/audit_log?transaction_id=1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "action" in data[0]
        assert "timestamp" in data[0]

# Test: Export Transactions
def test_export_transactions(test_client):
    response = test_client.get("/transaction/export?farmer_id=1")
    assert response.status_code == 200
    assert response.headers["content-type"] in ["text/csv", "application/json"]

# Test: Edge Cases (invalid, duplicate, etc.)
def test_transaction_edge_cases(test_client):
    # Invalid amount
    payload = {"farmer_id": 1, "amount": -100, "type": "sale"}
    response = test_client.post("/transaction/create", json=payload)
    assert response.status_code == 400
    # Duplicate transaction
    payload = {"farmer_id": 1, "amount": 1000, "type": "sale"}
    test_client.post("/transaction/create", json=payload)
    response = test_client.post("/transaction/create", json=payload)
    assert response.status_code in (400, 409)
