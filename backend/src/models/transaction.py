from sqlalchemy import Column, Integer, Numeric, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import TransactionType, TransactionStatus, PaymentStatus, CompletionStatus, RecordStatus

class Transaction(Base):
	__tablename__ = "transactions"

	id = Column(Integer, primary_key=True, index=True)
	shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
	buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
	parent_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
	type = Column(SQLEnum(TransactionType), nullable=False, default=TransactionType.SALE)
	status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)
	commission_rate = Column(Numeric(5,2), nullable=True, default=0.00)
	commission_amount = Column(Numeric(12,2), nullable=True, default=0.00)
	payment_status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
	buyer_paid_amount = Column(Numeric(12,2), nullable=True, default=0.00)
	farmer_paid_amount = Column(Numeric(12,2), nullable=True, default=0.00)
	commission_confirmed = Column(Boolean, nullable=True, default=False)
	completion_status = Column(SQLEnum(CompletionStatus), nullable=False, default=CompletionStatus.INCOMPLETE)
	date = Column(Date, nullable=False)
	created_at = Column(DateTime, nullable=False, default=func.now())
	updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
	record_status = Column(SQLEnum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)

	# Relationships
	shop = relationship("Shop", back_populates="transactions")
	buyer = relationship("User", back_populates="transactions_as_buyer")
	parent_transaction = relationship("Transaction", remote_side=[id])
	items = relationship("TransactionItem", back_populates="transaction")
	payments = relationship("Payment", back_populates="transaction")

	def __repr__(self):
		return f"<Transaction(id={self.id}, type={self.type}, status={self.status}, shop_id={self.shop_id})>"
