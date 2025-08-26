import pytest
from models import Payment, RecordStatus

def test_payments_exist(db_session):
    payments = db_session.query(Payment).all()
    assert len(payments) >= 1
    for payment in payments:
        assert payment.status == RecordStatus.ACTIVE
        assert payment.amount > 0
        assert payment.transaction_id is not None
