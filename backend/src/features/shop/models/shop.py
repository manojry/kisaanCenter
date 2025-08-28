from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ....database import Base
from ....models import RecordStatus


class Shop(Base):
    """Shop model for managing shop/store entities"""
    __tablename__ = 'shop'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    location = Column(String(200))
    plan_id = Column(Integer, ForeignKey('plan.id'))
    created_by = Column(Integer, ForeignKey('superadmin.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    plan = relationship('Plan', back_populates='shops')
    creator = relationship('Superadmin', back_populates='created_shops')
    users = relationship('User', foreign_keys='User.shop_id', back_populates='shop')
    products = relationship('Product', back_populates='shop')
    farmer_stocks = relationship('FarmerStock', back_populates='shop')
    transactions = relationship('Transaction', back_populates='shop')
    commission_rules = relationship('CommissionRule', back_populates='shop')
    expenses = relationship('Expense', back_populates='shop')
    stock_adjustments = relationship('StockAdjustment', back_populates='shop')
    
    # Subscription Management Relationships
    subscriptions = relationship('Subscription', back_populates='shop')
    feature_controls = relationship('FeatureControl', back_populates='shop')
    usage_tracking = relationship('UsageTracking', back_populates='shop')
    subscription_history = relationship('SubscriptionHistory', back_populates='shop')

    def __repr__(self):
        return f"<Shop(id={self.id}, name='{self.name}', location='{self.location}')>"
    
    def to_dict(self):
        """Convert Shop object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'plan_id': self.plan_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }