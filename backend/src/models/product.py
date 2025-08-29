from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL
from sqlalchemy.orm import relationship
from .base import Base

class Product(Base):
    __tablename__ = "product"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=True)
    unit = Column(String(20), nullable=False, default="kg")  # kg, liter, piece, etc.
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
