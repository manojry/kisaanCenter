from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import CreditStatus, RecordStatus

class Credit(Base):
	__tablename__ = "credits"

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
	amount = Column(Numeric(12,2), nullable=False)
	status = Column(SQLEnum(CreditStatus), nullable=False, default=CreditStatus.outstanding)
	record_status = Column(SQLEnum(RecordStatus), nullable=False, default=RecordStatus.ACTIVE)
	address = Column(Text, nullable=True)
	created_at = Column(DateTime, nullable=False, default=func.now())
	updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

	# Relationships
	user = relationship("User", back_populates="credits_as_buyer")

	def __repr__(self):
		return f"<Credit(id={self.id}, user_id={self.user_id}, amount={self.amount}, status={self.status})>"
