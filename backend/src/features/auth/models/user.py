from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from ....database import Base
from ....models import UserRole, RecordStatus


class User(Base):
    """User model for authentication and user management"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    shop_id = Column(Integer, ForeignKey('shops.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    contact = Column(String(20))
    credit_limit = Column(DECIMAL(12,2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    shop = relationship('Shop', foreign_keys='User.shop_id', back_populates='users')
    owned_shops = relationship('Shop', foreign_keys='Shop.owner_user_id', back_populates='owner')
    created_by_user = relationship('User', remote_side=[id])
    farmer_stocks = relationship('FarmerStock', back_populates='farmer_user')
    buyer_transactions = relationship('Transaction', foreign_keys='Transaction.buyer_user_id', back_populates='buyer_user')
    credits_as_buyer = relationship('Credit', back_populates='buyer_user')
    farmer_payments = relationship('FarmerPayment', back_populates='farmer_user')
    credit_details = relationship('CreditDetail', back_populates='farmer_user')
    created_expenses = relationship('Expense', back_populates='created_by_user')
    created_adjustments = relationship('StockAdjustment', back_populates='created_by_user')
    created_price_history = relationship('ProductPriceHistory', back_populates='created_by_user')
    audit_logs = relationship('AuditLog', back_populates='user')

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    def to_dict(self):
        """Convert User object to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role.value,
            'shop_id': self.shop_id,
            'contact': self.contact,
            'credit_limit': float(self.credit_limit) if self.credit_limit else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }