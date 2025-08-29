from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Transaction(Base):
    __tablename__ = "transaction"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shop.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    commission = Column(DECIMAL(10, 2), nullable=True, default=0.00)
    status = Column(String(20), nullable=False, default="pending")
    payment_status = Column(String(20), nullable=False, default="pending")
    completion_status = Column(String(20), nullable=False, default="pending")
    transaction_date = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id])
    farmer = relationship("User", foreign_keys=[farmer_id])
    shop = relationship("Shop")

class TransactionItem(Base):
    __tablename__ = "transaction_item"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transaction.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    quantity = Column(DECIMAL(10, 3), nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    transaction = relationship("Transaction")
    product = relationship("Product")
