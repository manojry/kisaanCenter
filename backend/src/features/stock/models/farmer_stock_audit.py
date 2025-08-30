
from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from src.database.base import Base
from src.core.enums import AuditAction

class FarmerStockAudit(Base):
    __tablename__ = 'farmer_stock_audit'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'), nullable=False, index=True)
    performed_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Audit Details
    action_type = Column(String(50), nullable=False)  # Using AuditAction enum values
    old_values = Column(JSON, nullable=True)  # Previous state
    new_values = Column(JSON, nullable=True)  # New state
    
    # Context
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True)  # If related to transaction
    notes = Column(Text, nullable=True)
    
    # System Fields
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    farmer_stock = relationship('FarmerStock', back_populates='audit_logs')
    performed_by = relationship('User')
    transaction = relationship('Transaction')
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_stock_time', 'farmer_stock_id', 'timestamp'),
        Index('idx_audit_action_time', 'action_type', 'timestamp'),
    )
