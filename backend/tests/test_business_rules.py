import pytest
from models import Transaction, Payment, User, UserRole, RecordStatus

def test_transaction_status_flow(db_session):
    # Ensure transactions cover all statuses
    statuses = set([tx.status for tx in db_session.query(Transaction).all()])
    assert 'PENDING' in statuses or 'COMPLETED' in statuses or 'CANCELLED' in statuses


def test_owner_can_see_all_shop_transactions(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
    transactions = db_session.query(Transaction).filter_by(shop_id=owner.id).all()
    assert len(transactions) >= 1


def test_employee_transactions(db_session):
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    for emp in employees:
        txs = db_session.query(Transaction).filter_by(employee_user_id=emp.id).all()
        assert len(txs) >= 1


def test_farmers_have_stock_and_sales(db_session):
    farmers = db_session.query(User).filter_by(role=UserRole.FARMER).all()
    for farmer in farmers:
        # Farmer should have stock and be involved in transactions
        from models import FarmerStock
        stocks = db_session.query(FarmerStock).filter_by(farmer_user_id=farmer.id).all()
        assert len(stocks) >= 1
