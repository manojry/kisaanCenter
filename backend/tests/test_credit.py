import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from models import Credit, CreditDetail, RecordStatus

def test_credits_exist(db_session):
    credits = db_session.query(Credit).all()
    assert len(credits) >= 1
    for credit in credits:
        from models import CreditStatus
        assert credit.status in [CreditStatus.OUTSTANDING, CreditStatus.PARTIAL, CreditStatus.SETTLED]
        assert credit.amount > 0
        assert credit.transaction_id is not None

def test_credit_details_exist(db_session):
    details = db_session.query(CreditDetail).all()
    assert len(details) >= 1
    for detail in details:
        assert detail.credit_id is not None
        assert detail.farmer_user_id is not None
        assert detail.product_id is not None
        assert detail.quantity > 0
        assert detail.price > 0
