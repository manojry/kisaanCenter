from sqlalchemy import Column, Integer, String, Text, DateTime, func
from .base import Base
from .enums import RecordStatus

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=True, default="active")
    created_at = Column(DateTime, nullable=True, default=func.now())
    updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ExpenseCategory(id={self.id}, name='{self.name}')>"
