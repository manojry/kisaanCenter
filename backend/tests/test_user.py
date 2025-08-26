import pytest
from models import User, UserRole, RecordStatus

def test_superadmin_exists(db_session):
    user = db_session.query(User).filter_by(role=UserRole.SUPERADMIN).first()
    assert user is not None
    assert user.status == RecordStatus.ACTIVE

def test_owner_and_employees(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
    assert owner is not None
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    assert len(employees) >= 1
    for emp in employees:
        assert emp.status == RecordStatus.ACTIVE

def test_farmers_and_buyers(db_session):
    farmers = db_session.query(User).filter_by(role=UserRole.FARMER).all()
    buyers = db_session.query(User).filter_by(role=UserRole.BUYER).all()
    assert len(farmers) >= 1
    assert len(buyers) >= 1
    for farmer in farmers:
        assert farmer.status == RecordStatus.ACTIVE
    for buyer in buyers:
        assert buyer.status == RecordStatus.ACTIVE
