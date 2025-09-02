from sqlalchemy import Column, Integer, String, DECIMAL, Text, DateTime, Boolean, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .base import Base
from .enums import RecordStatus

class Plan(Base):
	__tablename__ = "plans"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False, unique=True)
	description = Column(Text, nullable=True)
	monthly_price = Column(DECIMAL(10, 2), nullable=False)
	quarterly_price = Column(DECIMAL(10, 2), nullable=True)
	yearly_price = Column(DECIMAL(10, 2), nullable=True)
	max_farmers = Column(Integer, nullable=False)
	max_buyers = Column(Integer, nullable=False)
	max_transactions = Column(Integer, nullable=False)
	data_retention_months = Column(Integer, default=12)
	features = Column(JSONB, nullable=True)
	status = Column(SQLEnum(RecordStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=True, default=RecordStatus.ACTIVE)
	created_at = Column(DateTime, nullable=True, default=func.now())
	updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

	# Relationships
	subscriptions = relationship("Subscription", back_populates="plan")

	def __repr__(self):
		return f"<Plan(id={self.id}, name='{self.name}', monthly_price={self.monthly_price})>"
