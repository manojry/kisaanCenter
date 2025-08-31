
from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, Boolean, Enum as SQLEnum, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import date, datetime
from decimal import Decimal

from src.database.base import Base
from src.core.enums import RecordStatus, FarmerStockMode

class FarmerStock(Base):
    __tablename__ = 'farmer_stock'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farmer_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False, index=True)
    
    # Stock Quantities
    declared_qty = Column(DECIMAL(10,3), nullable=True)  # NULL for implicit mode
    sold_qty = Column(DECIMAL(10,3), nullable=False, default=0)
    
    # Pricing
    unit_price = Column(DECIMAL(10,2), nullable=True)  # Average/expected price
    
    # Stock Management
    mode = Column(SQLEnum(FarmerStockMode), nullable=False, default=FarmerStockMode.IMPLICIT)
    declared_at = Column(DateTime, nullable=True)  # When farmer made declaration
    declared_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Who recorded declaration
    
    # Carryover Support
    carry_forward = Column(Boolean, default=False)
    carried_from_date = Column(Date, nullable=True)
    
    # Business Fields
    entry_date = Column(Date, default=date.today, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(RecordStatus), default=RecordStatus.ACTIVE, nullable=False)
    
    # Relationships
    farmer = relationship('User', foreign_keys=[farmer_id], back_populates='farmer_stocks')
    declared_by = relationship('User', foreign_keys=[declared_by_id])
    product = relationship('Product', back_populates='farmer_stocks')
    shop = relationship('Shop', back_populates='farmer_stocks')
    audit_logs = relationship('FarmerStockAudit', back_populates='farmer_stock', cascade='all, delete-orphan')
    
    # Computed Properties
    @hybrid_property
    def balance_qty(self):
        """Calculate remaining stock balance"""
        if self.declared_qty is not None:
            return self.declared_qty - self.sold_qty
        return None
    
    @hybrid_property
    def total_value(self):
        """Calculate total value of stock"""
        if self.declared_qty and self.unit_price:
            return self.declared_qty * self.unit_price
        return None
    
    @hybrid_property
    def sold_value(self):
        """Calculate value of sold stock"""
        if self.unit_price:
            return self.sold_qty * self.unit_price
        return None
    
    @hybrid_property
    def is_oversold(self):
        """Check if sold quantity exceeds declared quantity"""
        if self.declared_qty is not None:
            return self.sold_qty > self.declared_qty
        return False
    
    @hybrid_property
    def completion_percentage(self):
        """Calculate percentage of stock sold"""
        if self.declared_qty and self.declared_qty > 0:
            return min((self.sold_qty / self.declared_qty) * 100, 100)
        return None
    
    # Constraints
    __table_args__ = (
        # Unique constraint: one record per farmer+product+date+shop
    UniqueConstraint('farmer_id', 'product_id', 'entry_date', 'shop_id', 
                        name='uq_farmer_stock_daily'),
        # Index for performance
    Index('idx_farmer_stock_lookup', 'farmer_id', 'product_id', 'entry_date'),
        Index('idx_farmer_stock_shop_date', 'shop_id', 'entry_date'),
        Index('idx_farmer_stock_mode', 'mode', 'entry_date'),
    )
