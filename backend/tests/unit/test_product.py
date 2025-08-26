import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from models import Product, RecordStatus

def test_products_exist(db_session):
    products = db_session.query(Product).all()
    assert len(products) >= 1
    for product in products:
        assert product.status == RecordStatus.ACTIVE
