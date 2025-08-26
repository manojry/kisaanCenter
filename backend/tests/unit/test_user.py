import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from models import User, UserRole, RecordStatus

def test_superadmin_exists(db_session):
    user = db_session.query(User).filter_by(role=UserRole.SUPERADMIN).first()
    assert user is not None, "No superadmin user found"
    assert user.status == RecordStatus.ACTIVE

def test_owner_and_employees(db_session):
    owner = db_session.query(User).filter_by(role=UserRole.OWNER).first()
    assert owner is not None, "No owner user found"
    employees = db_session.query(User).filter_by(role=UserRole.EMPLOYEE).all()
    assert len(employees) >= 1, "No employees found"
    for emp in employees:
        assert emp.status == RecordStatus.ACTIVE

def test_farmers_and_buyers(db_session):
    farmers = db_session.query(User).filter_by(role=UserRole.FARMER).all()
    buyers = db_session.query(User).filter_by(role=UserRole.BUYER).all()
    assert len(farmers) >= 1, "No farmers found"
    assert len(buyers) >= 1, "No buyers found"
    for farmer in farmers:
        assert farmer.status == RecordStatus.ACTIVE
    for buyer in buyers:
        assert buyer.status == RecordStatus.ACTIVE
