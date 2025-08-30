from sqlalchemy import Column, Integer, String, Date, Boolean, DECIMAL, DateTime, func
from .base import Base

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, nullable=False)
    plan_id = Column(Integer, nullable=False)
    billing_cycle = Column(String(20), nullable=False, default="monthly")
    auto_renew = Column(Boolean, default=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    payment_status = Column(String(20), nullable=False, default="pending")
    amount = Column(DECIMAL(10, 2), nullable=True)
    discount_amount = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
