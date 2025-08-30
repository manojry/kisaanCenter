from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, func, ForeignKey, Enum
from .base import Base
from .enums import CreditStatus, RecordStatus

class Credit(Base):
    __tablename__ = "credit"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(DECIMAL(12,2), nullable=False)
    status = Column(Enum(CreditStatus), nullable=False, default=CreditStatus.PENDING)
    record_status = Column(Enum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())