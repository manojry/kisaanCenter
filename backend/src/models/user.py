from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import Base
from .enums import UserRole, RecordStatus

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    contact = Column(String(15), nullable=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    credit_limit = Column(DECIMAL(12,2), nullable=True, default=0.00)
    status = Column(Enum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

class Superadmin(Base):
    __tablename__ = "superadmin"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

class UserActivity(Base):
    __tablename__ = "user_activity"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())