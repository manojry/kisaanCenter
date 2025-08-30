from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date, 
    ForeignKey, Enum, DECIMAL
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .enums import PaymentType, FarmerPaymentType, RecordStatus
from ..database import Base

class PaymentMethod(Base):
    """Payment method model for storing available payment options"""
    __tablename__ = 'payment_method'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    payments = relationship('Payment', back_populates='payment_method')
    farmer_payments = relationship('FarmerPayment', back_populates='payment_method')

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Payment(Base):
    """Payment model for buyer payments towards transactions"""
    __tablename__ = 'payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=False)
    credit_id = Column(Integer, ForeignKey('credit.id'), nullable=True)
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'), nullable=False)
    type = Column(Enum(PaymentType), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    date = Column(Date, nullable=False)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    processed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='payments')
    credit = relationship('Credit', back_populates='payments')
    payment_method = relationship('PaymentMethod', back_populates='payments')
    processed_by_user = relationship('User', foreign_keys=[processed_by])

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'credit_id': self.credit_id,
            'amount': float(self.amount) if self.amount else 0,
            'payment_method_id': self.payment_method_id,
            'type': self.type.value if self.type else None,
            'status': self.status.value if self.status else None,
            'date': self.date.isoformat() if self.date else None,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'processed_by': self.processed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_complete(self):
        """Check if payment is complete"""
        return self.status == RecordStatus.ACTIVE and self.amount > 0

    def get_display_amount(self):
        """Get formatted amount for display"""
        return f"₹{self.amount:,.2f}" if self.amount else "₹0.00"


class FarmerPayment(Base):
    """Farmer payment model for payments made to farmers"""
    __tablename__ = 'farmer_payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=False)
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'), nullable=True)
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_type = Column(Enum(FarmerPaymentType), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'), nullable=False)
    remarks = Column(Text, nullable=True)
    date = Column(Date, nullable=False)
    reference_number = Column(String(100), nullable=True)
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='farmer_payments')
    farmer_stock = relationship('FarmerStock', back_populates='farmer_payments')
    farmer_user = relationship('User', back_populates='farmer_payments', foreign_keys=[farmer_user_id])
    payment_method = relationship('PaymentMethod', back_populates='farmer_payments')
    approved_by_user = relationship('User', foreign_keys=[approved_by])

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'farmer_stock_id': self.farmer_stock_id,
            'farmer_user_id': self.farmer_user_id,
            'amount': float(self.amount) if self.amount else 0,
            'payment_type': self.payment_type.value if self.payment_type else None,
            'payment_method_id': self.payment_method_id,
            'remarks': self.remarks,
            'date': self.date.isoformat() if self.date else None,
            'reference_number': self.reference_number,
            'approved_by': self.approved_by,
            'status': self.status.value if self.status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def get_display_amount(self):
        """Get formatted amount for display"""
        return f"₹{self.amount:,.2f}" if self.amount else "₹0.00"
