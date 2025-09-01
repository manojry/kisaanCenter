from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus

class Shop(Base):
	__tablename__ = "shops"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False)
	address = Column(Text, nullable=True)
	location = Column(String(255), nullable=True)
	contact = Column(String(15), nullable=True)
	commission_rate = Column(Numeric(5,2), nullable=False, default=0.00)
	owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
	plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
	plan_start_date = Column(Date, nullable=True)
	plan_end_date = Column(Date, nullable=True)
	status = Column(SQLEnum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
	created_at = Column(DateTime, nullable=False, default=func.now())
	updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

	# Relationships
	subscriptions = relationship("Subscription", back_populates="shop")
	farmer_stocks = relationship("FarmerStock", back_populates="shop")
	credits = relationship("Credit", back_populates="shop")
	transactions = relationship("Transaction", back_populates="shop")

	def __repr__(self):
		return f"<Shop(id={self.id}, name='{self.name}', commission_rate={self.commission_rate})>"
