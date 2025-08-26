import pytest
from models import Shop, User, UserRole, RecordStatus

def test_shop_owner_relationship(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
    shop = db_session.query(Shop).filter_by(owner_user_id=owner.id).first()
    assert shop is not None
    assert shop.status == RecordStatus.ACTIVE
    assert shop.owner_user_id == owner.id

def test_shop_employees(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    assert len(employees) >= 1
    # Optionally, check for employee-shop relationship if modeled
