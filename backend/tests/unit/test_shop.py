import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from src.models import Shop, User, UserRole, RecordStatus

def test_shop_owner_relationship(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.OWNER).first()
    assert owner is not None, "No owner user found in database"
    
    shop = db_session.query(Shop).filter_by(owner_user_id=owner.id).first()
    assert shop is not None, "No shop found for owner"
    assert shop.status == 'active'
    assert shop.owner_user_id == owner.id

def test_shop_employees(db_session):
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    assert len(employees) >= 1, "No employees found in database"
    
    # Check that employees are associated with a shop
    for employee in employees:
        assert employee.shop_id is not None, f"Employee {employee.username} not associated with a shop"
    assert employee.status == 'active'
