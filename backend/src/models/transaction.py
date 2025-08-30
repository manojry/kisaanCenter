from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey, Boolean, Date, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .enums import TransactionStatus, PaymentStatus, CompletionStatus, RecordStatus

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    buyer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    parent_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    type = Column(String(20), nullable=False, default="sale")
    status = Column(Enum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)
    commission_rate = Column(DECIMAL(5, 2), nullable=True, default=0.00)
    commission_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    buyer_paid_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    farmer_paid_amount = Column(DECIMAL(12, 2), nullable=True, default=0.00)
    commission_confirmed = Column(Boolean, nullable=True, default=False)
    completion_status = Column(Enum(CompletionStatus), nullable=False, default=CompletionStatus.INCOMPLETE)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

class TransactionItem(Base):
    __tablename__ = "transaction_items"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    farmer_stock_id = Column(Integer, nullable=True)
    quantity = Column(DECIMAL(10, 3), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(Enum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=func.now())