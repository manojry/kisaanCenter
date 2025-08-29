from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Payment(Base):
    __tablename__ = "payment"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transaction.id"), nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    method = Column(String(50), nullable=False)  # cash, card, bank_transfer, etc.
    status = Column(String(20), nullable=False, default="pending")
    paid_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    paid_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_date = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    transaction = relationship("Transaction")
    payer = relationship("User", foreign_keys=[paid_by])
    payee = relationship("User", foreign_keys=[paid_to])
