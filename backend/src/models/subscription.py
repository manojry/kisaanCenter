from sqlalchemy import Column, Integer, Numeric, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum, func, String
from sqlalchemy.orm import relationship
from .base import Base
from .enums import SubscriptionStatus, PaymentStatus, RecordStatus

class Subscription(Base):
	__tablename__ = "subscriptions"

	id = Column(Integer, primary_key=True, index=True)
	shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
	plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
	billing_cycle = Column(String(20), nullable=False, default="monthly")
	auto_renew = Column(Boolean, nullable=True, default=True)
	start_date = Column(Date, nullable=True)
	end_date = Column(Date, nullable=True)
	status = Column(SQLEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
	payment_status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID)
	amount = Column(Numeric(12,2), nullable=True)
	discount_amount = Column(Numeric(12,2), nullable=True)
	created_at = Column(DateTime, nullable=True, default=func.now())
	updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

	# Relationships
	shop = relationship("Shop", back_populates="subscriptions")
	plan = relationship("Plan", back_populates="subscriptions")

	def __repr__(self):
		return f"<Subscription(id={self.id}, shop_id={self.shop_id}, plan_id={self.plan_id}, status='{self.status}')>"
