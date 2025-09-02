from sqlalchemy import Column, Integer, Numeric, DateTime, Date, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus, StockMode

class FarmerStock(Base):
	__tablename__ = "farmer_stocks"

	id = Column(Integer, primary_key=True, index=True)
	farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
	product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
	shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
	mode = Column(SQLEnum(StockMode), default=StockMode.DECLARED)
	declared_qty = Column(Numeric(10, 3), nullable=True)
	sold_qty = Column(Numeric(10, 3), default=0.000)
	expired_qty = Column(Numeric(10, 3), default=0.000)
	balance_qty = Column(Numeric(10, 3), default=0.000)
	price_per_unit = Column(Numeric(10, 2), nullable=True)
	status = Column(SQLEnum(RecordStatus), default=RecordStatus.ACTIVE)
	date = Column(Date, nullable=False)
	created_at = Column(DateTime, nullable=True, default=func.now())
	updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

	# Relationships
	farmer = relationship("User", foreign_keys=[farmer_id])
	product = relationship("Product", back_populates="farmer_stocks")
	shop = relationship("Shop", back_populates="farmer_stocks")

	def __repr__(self):
		return f"<FarmerStock(id={self.id}, farmer_id={self.farmer_id}, product_id={self.product_id}, mode='{self.mode}', balance_qty={self.balance_qty})>"
