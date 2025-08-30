from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    category_id = Column(Integer, nullable=True)
    unit = Column(String(20), nullable=False, default="kg")
    status = Column(Enum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())