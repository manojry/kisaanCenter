from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from .base import Base

class Shop(Base):
    __tablename__ = "shop"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    contact = Column(String(15), nullable=True)
    commission_rate = Column(DECIMAL(5, 2), nullable=False, default=0.00)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    plan_start_date = Column(DateTime, nullable=True)
    plan_end_date = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User")
