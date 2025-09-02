from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, func
from .base import Base
from .enums import RecordStatus

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(RecordStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=True, default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
