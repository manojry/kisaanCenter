from sqlalchemy import Column, Integer, String, Float, Date, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus

class Shop(Base):
    __tablename__ = "shops"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    location = Column(String(255), nullable=True)
    contact = Column(String(15), nullable=True)
    commission_rate = Column(Float, default=0.0)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    plan_id = Column(Integer, nullable=True)
    created_by = Column(Integer, nullable=True)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())