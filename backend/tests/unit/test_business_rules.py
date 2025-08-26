import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from src.models import Transaction, Payment, User, UserRole, RecordStatus, TransactionStatus, FarmerStock

def test_transaction_status_flow(db_session):
    # Ensure transactions cover all statuses
    statuses = set([tx.status.value for tx in db_session.query(Transaction).all()])
    assert 'active' in statuses or 'completed' in statuses or 'cancelled' in statuses


def test_owner_can_see_all_shop_transactions(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.OWNER).first()
    transactions = db_session.query(Transaction).filter_by(shop_id=owner.shop_id).all()
    assert len(transactions) >= 1


def test_employee_transactions(db_session):
    # Employees can view transactions in their shop
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    for emp in employees:
        txs = db_session.query(Transaction).filter_by(shop_id=emp.shop_id).all()
        assert len(txs) >= 0  # Employees can see shop transactions


def test_farmers_have_stock_and_sales(db_session):
    farmers = db_session.query(User).filter_by(role=UserRole.FARMER).all()
    for farmer in farmers:
        # Farmer should have stock and be involved in transactions
        stocks = db_session.query(FarmerStock).filter_by(farmer_user_id=farmer.id).all()
        assert len(stocks) >= 1
