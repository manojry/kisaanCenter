from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Enum as SQLEnum, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base
from .enums import UserRole, RecordStatus

class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, index=True)
	username = Column(String(50), unique=True, nullable=False)
	password_hash = Column(String(128), nullable=False)
	role = Column(SQLEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
	shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
	contact = Column(String(20), nullable=True)
	credit_limit = Column(Numeric(12,2), nullable=True, default=0.0)
	record_status = Column(SQLEnum(RecordStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=RecordStatus.ACTIVE)
	created_by = Column(Integer, nullable=True)
	created_at = Column(DateTime, nullable=False, default=func.now())
	updated_at = Column(DateTime, nullable=True, onupdate=func.now())

	shop = relationship("Shop", back_populates="users", foreign_keys=[shop_id])
	credits_as_buyer = relationship("Credit", back_populates="user")

	def __repr__(self):
		return f"<User(id={self.id}, username={self.username}, role={self.role}, shop_id={self.shop_id})>"
