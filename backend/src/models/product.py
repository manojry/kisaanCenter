from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus

class Product(Base):
	__tablename__ = "products"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False)
	description = Column(Text, nullable=True)
	category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
	price = Column(Numeric(12,2), nullable=True)
	status = Column(SQLEnum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
	created_at = Column(DateTime, nullable=False, default=func.now())
	updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

	# Relationships
	farmer_stocks = relationship("FarmerStock", back_populates="product")
	transaction_items = relationship("TransactionItem", back_populates="product")

	def __repr__(self):
		return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"
