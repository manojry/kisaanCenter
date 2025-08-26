import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from src.models import Transaction, TransactionStatus, CompletionStatus, PaymentStatus, RecordStatus

def test_monthly_transactions_exist(db_session):
    transactions = db_session.query(Transaction).all()
    assert len(transactions) >= 30  # At least one per day
    for tx in transactions:
        assert tx.status in [TransactionStatus.ACTIVE, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]
        assert tx.completion_status in [CompletionStatus.PENDING, CompletionStatus.PARTIAL, CompletionStatus.COMPLETE]
        assert tx.payment_status in [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.PAID]

def test_transaction_integrity(db_session):
    tx = db_session.query(Transaction).first()
    assert tx is not None
    assert tx.shop_id is not None
    assert tx.buyer_user_id is not None
    # Transaction doesn't have product_id directly, it's in transaction_items
    from src.models import TransactionItem
    items = db_session.query(TransactionItem).filter_by(transaction_id=tx.id).all()
    if items:
        assert len(items) > 0
        assert items[0].quantity > 0
        assert items[0].price > 0
