# User model for Market Management System
from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # Changed from password to password_hash
    role = Column(String(20), nullable=False)
    contact = Column(String(15), nullable=True)
    shop_id = Column(Integer, nullable=True)
    credit_limit = Column(DECIMAL(12,2), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # Added status field
    created_by = Column(Integer, nullable=True)  # Added created_by field that exists in DB
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    shops = relationship("Shop")
