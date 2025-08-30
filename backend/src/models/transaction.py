from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from .base import Base

class Transaction(Base):
    __tablename__ = "transaction"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shop.id"), nullable=False, index=True)
    buyer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    parent_transaction_id = Column(Integer, ForeignKey("transaction.id"), nullable=True)
    type = Column(String, nullable=True, default="sale")  # Column name from database
    status = Column(String, nullable=True, default="active")
    commission_rate = Column(DECIMAL(5, 2), nullable=True, default=0.00)
    commission_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    payment_status = Column(String, nullable=True, default="pending")
    buyer_paid_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    farmer_paid_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    commission_confirmed = Column(Boolean, nullable=True, default=False)
    completion_status = Column(String, nullable=True, default="pending")
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=True, default=func.now())
    updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop")
    buyer = relationship("User", foreign_keys=[buyer_user_id])
    parent_transaction = relationship("Transaction", remote_side=[id])

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
