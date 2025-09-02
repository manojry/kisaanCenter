from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, func
from .base import Base
from .enums import RecordStatus

class Superadmin(Base):
	__tablename__ = "superadmin"

	id = Column(Integer, primary_key=True, index=True)
	username = Column(String(50), unique=True, nullable=False)
	password_hash = Column(String(255), nullable=False)
	email = Column(String(100), unique=True, nullable=False)
	contact = Column(String(15), nullable=True)
	created_at = Column(DateTime, nullable=True, default=func.now())
	updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())
	status = Column(SQLEnum(RecordStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=True, default=RecordStatus.ACTIVE)

	def __repr__(self):
		return f"<Superadmin(id={self.id}, username={self.username}, email={self.email}, status={self.status})>"
