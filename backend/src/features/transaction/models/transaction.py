from sqlalchemy import Column, Integer, DateTime, Enum, ForeignKey, DECIMAL, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from ....database import Base
from ....models import TransactionType, TransactionStatus, PaymentStatus, CompletionStatus, RecordStatus


class Transaction(Base):
    """Transaction model for managing business transactions with three-party completion"""
    __tablename__ = 'transaction'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False, index=True)
    buyer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    parent_transaction_id = Column(Integer, ForeignKey('transaction.id'))
    type = Column(Enum(TransactionType), default=TransactionType.SALE)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.ACTIVE)
    commission_rate = Column(DECIMAL(5,2), default=0.00)
    commission_amount = Column(DECIMAL(12,2), default=0.00)
    total_amount = Column(DECIMAL(12,2), default=0.00)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Transaction Completion Fields (Three-Party Model)
    buyer_paid_amount = Column(DECIMAL(12,2), default=0.00)
    farmer_paid_amount = Column(DECIMAL(12,2), default=0.00)
    commission_confirmed = Column(Boolean, default=False)
    completion_status = Column(Enum(CompletionStatus), default=CompletionStatus.PENDING)
    
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='transactions')
    buyer_user = relationship('User', back_populates='buyer_transactions')
    parent_transaction = relationship('Transaction', remote_side=[id])
    transaction_items = relationship('TransactionItem', back_populates='transaction')
    payments = relationship('Payment', back_populates='transaction')
    credits = relationship('Credit', back_populates='transaction')
    farmer_payments = relationship('FarmerPayment', back_populates='transaction')

    def __repr__(self):
        return f"<Transaction(id={self.id}, shop_id={self.shop_id}, buyer_id={self.buyer_user_id}, total={self.total_amount})>"
    
    def to_dict(self):
        """Convert Transaction object to dictionary"""
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'buyer_user_id': self.buyer_user_id,
            'parent_transaction_id': self.parent_transaction_id,
            'type': self.type.value if self.type else None,
            'status': self.status.value if self.status else None,
            'commission_rate': float(self.commission_rate) if self.commission_rate else 0.0,
            'commission_amount': float(self.commission_amount) if self.commission_amount else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'payment_status': self.payment_status.value if self.payment_status else None,
            'buyer_paid_amount': float(self.buyer_paid_amount) if self.buyer_paid_amount else 0.0,
            'farmer_paid_amount': float(self.farmer_paid_amount) if self.farmer_paid_amount else 0.0,
            'commission_confirmed': self.commission_confirmed,
            'completion_status': self.completion_status.value if self.completion_status else None,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TransactionItem(Base):
    """Transaction item model for individual products in a transaction"""
    __tablename__ = 'transaction_item'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'))
    quantity = Column(DECIMAL(10,2), nullable=False)
    price = Column(DECIMAL(10,2), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='transaction_items')
    product = relationship('Product', back_populates='transaction_items')
    farmer_stock = relationship('FarmerStock', back_populates='transaction_items')

    def __repr__(self):
        return f"<TransactionItem(id={self.id}, transaction_id={self.transaction_id}, product_id={self.product_id}, qty={self.quantity})>"
    
    def to_dict(self):
        """Convert TransactionItem object to dictionary"""
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'product_id': self.product_id,
            'farmer_stock_id': self.farmer_stock_id,
            'quantity': float(self.quantity) if self.quantity else 0.0,
            'price': float(self.price) if self.price else 0.0,
            'status': self.status.value if self.status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }