import pytest
from models import Transaction, TransactionStatus, CompletionStatus, PaymentStatus, RecordStatus

def test_monthly_transactions_exist(db_session):
    transactions = db_session.query(Transaction).all()
    assert len(transactions) >= 30  # At least one per day
    for tx in transactions:
        assert tx.status in TransactionStatus
        assert tx.completion_status in CompletionStatus
        assert tx.payment_status in PaymentStatus
        assert tx.status == RecordStatus.ACTIVE or tx.status in [TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]

def test_transaction_integrity(db_session):
    tx = db_session.query(Transaction).first()
    assert tx is not None
    assert tx.shop_id is not None
    assert tx.buyer_user_id is not None
    assert tx.product_id is not None
    assert tx.quantity > 0
    assert tx.price > 0
