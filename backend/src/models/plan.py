from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, func
from .base import Base

class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    quarterly_price = Column(DECIMAL(10, 2), nullable=True)
    yearly_price = Column(DECIMAL(10, 2), nullable=True)
    max_farmers = Column(Integer, nullable=True)
    max_buyers = Column(Integer, nullable=True)
    max_transactions = Column(Integer, nullable=True)
    data_retention_months = Column(Integer, nullable=True)
    features = Column(String, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
