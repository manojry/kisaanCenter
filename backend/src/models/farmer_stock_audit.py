from datetime import datetime
from sqlalchemy import (
    Column, Integer, ForeignKey, String, Text, DateTime, JSON, Index
)
from sqlalchemy.orm import relationship
from .base import Base

class FarmerStockAudit(Base):
    __tablename__ = "farmer_stock_audit"

    id = Column(Integer, primary_key=True)
    farmer_stock_id = Column(Integer, ForeignKey("farmer_stock.id", ondelete="CASCADE"), nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Audit Details
    action_type = Column(String(50), nullable=False)  # declare, sale, update, late_declare, carry_forward, correction, mode_change
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)

    # Context
    transaction_id = Column(Integer, ForeignKey("transaction.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)

    # System Fields
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    farmer_stock = relationship("FarmerStock", back_populates="audit_logs")
    performed_by = relationship("User")
    transaction = relationship("Transaction")

    __table_args__ = (
        Index('idx_farmer_stock_audit_fsid', 'farmer_stock_id'),
        Index('idx_farmer_stock_audit_action', 'action_type'),
        Index('idx_farmer_stock_audit_created_at', 'timestamp'),
    )
