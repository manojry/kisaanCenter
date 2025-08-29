from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from ....database import Base
from ....models import RecordStatus


class Shop(Base):
    """Shop model for managing shop/store entities"""
    __tablename__ = 'shop'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Foreign Keys
    owner_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    plan_id = Column(Integer, ForeignKey('plans.id'))
    
    # Business Fields
    address = Column(Text)
    contact = Column(String(20))
    commission_rate = Column(DECIMAL(5,2), default=5.00)  # Percentage
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    owner = relationship('User', foreign_keys='Shop.owner_user_id', back_populates='owned_shops')
    users = relationship('User', foreign_keys='User.shop_id', back_populates='shop')
    products = relationship('Product', back_populates='shop')
    transactions = relationship('Transaction', back_populates='shop')
    farmer_stocks = relationship('FarmerStock', back_populates='shop')
    credits = relationship('Credit', back_populates='shop')
    expenses = relationship('Expense', back_populates='shop')
    plan = relationship('Plan', back_populates='shops')
    
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
            'description': self.description,
            'owner_user_id': self.owner_user_id,
            'plan_id': self.plan_id,
            'address': self.address,
            'contact': self.contact,
            'commission_rate': float(self.commission_rate) if self.commission_rate else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }
