import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from models import Payment, RecordStatus

def test_payments_exist(db_session):
    payments = db_session.query(Payment).all()
    assert len(payments) >= 1
    for payment in payments:
        assert payment.status == RecordStatus.ACTIVE
        assert payment.amount > 0
        # Payment can be linked to either transaction or credit
        assert payment.transaction_id is not None or payment.credit_id is not None
