
"""
Market Management System - SQLAlchemy Models

This module contains the core database models aligned with the ERD specification.
Models support the three-party transaction completion workflow and financial dashboards.

Related Documentation:
- ERD: /Documents/Architecture/ERD.md
- Database Schema: /Documents/Architecture/Database_Schema.md  
- Business Rules: /Documents/Architecture/Business_Rules.md
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, DECIMAL, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
import enum

Base = declarative_base()

# Enums for type safety
class UserRole(enum.Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    EMPLOYEE = "employee"
    FARMER = "farmer"
    BUYER = "buyer"
    GUEST = "guest"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class CompletionStatus(enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETE = "complete"
    CANCELLED = "cancelled"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETE = "complete"

class RecordStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DELETED = "deleted"

# Core Entities
class Superadmin(Base):
    __tablename__ = 'superadmin'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

class Shop(Base):
    __tablename__ = 'shop'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    location = Column(String(255))
    plan_id = Column(Integer, ForeignKey('plan.id'))
    created_by = Column(Integer, ForeignKey('superadmin.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    users = relationship('User', back_populates='shop')
    transactions = relationship('Transaction', back_populates='shop')
    products = relationship('Product', back_populates='shop')
    farmer_stocks = relationship('FarmerStock', back_populates='shop')

class User(Base):
    __tablename__ = 'user'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=True)
    created_by = Column(Integer, ForeignKey('user.id'), nullable=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(50))
    credit_limit = Column(DECIMAL(12,2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    shop = relationship('Shop', back_populates='users')
    farmer_stocks = relationship('FarmerStock', back_populates='farmer_user')
    buyer_transactions = relationship('Transaction', foreign_keys='Transaction.buyer_user_id', back_populates='buyer_user')
    credits_as_buyer = relationship('Credit', foreign_keys='Credit.buyer_user_id', back_populates='buyer_user')
    farmer_payments = relationship('FarmerPayment', back_populates='farmer_user')

class Product(Base):
    __tablename__ = 'product'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey('category.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    shop = relationship('Shop', back_populates='products')
    farmer_stocks = relationship('FarmerStock', back_populates='product')
    transaction_items = relationship('TransactionItem', back_populates='product')

class FarmerStock(Base):
    __tablename__ = 'farmer_stock'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    farmer_user_id = Column(Integer, ForeignKey('user.id'))
    product_id = Column(Integer, ForeignKey('product.id'))
    quantity = Column(DECIMAL(10,3), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='farmer_stocks')
    farmer_user = relationship('User', back_populates='farmer_stocks')
    product = relationship('Product', back_populates='farmer_stocks')
    transaction_items = relationship('TransactionItem', back_populates='farmer_stock')

class Transaction(Base):
    __tablename__ = 'transaction'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    buyer_user_id = Column(Integer, ForeignKey('user.id'))
    parent_transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=True)
    type = Column(String(20), default='sale')  # sale, return, exchange
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    commission_rate = Column(DECIMAL(5,2), nullable=False)
    commission_amount = Column(DECIMAL(12,2), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Transaction Completion Fields
    buyer_paid_amount = Column(DECIMAL(12,2), default=0)
    farmer_paid_amount = Column(DECIMAL(12,2), default=0)
    commission_confirmed = Column(Boolean, default=False)
    completion_status = Column(Enum(CompletionStatus), default=CompletionStatus.PENDING)
    
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='transactions')
    buyer_user = relationship('User', foreign_keys=[buyer_user_id], back_populates='buyer_transactions')
    transaction_items = relationship('TransactionItem', back_populates='transaction')
    payments = relationship('Payment', back_populates='transaction')
    credits = relationship('Credit', back_populates='transaction')
    farmer_payments = relationship('FarmerPayment', back_populates='transaction')

class TransactionItem(Base):
    __tablename__ = 'transaction_item'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    product_id = Column(Integer, ForeignKey('product.id'))
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'))
    quantity = Column(DECIMAL(10,3), nullable=False)
    price = Column(DECIMAL(12,2), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='transaction_items')
    product = relationship('Product', back_populates='transaction_items')
    farmer_stock = relationship('FarmerStock', back_populates='transaction_items')

class Credit(Base):
    __tablename__ = 'credit'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    buyer_user_id = Column(Integer, ForeignKey('user.id'))
    amount = Column(DECIMAL(12,2), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='credits')
    buyer_user = relationship('User', foreign_keys=[buyer_user_id], back_populates='credits_as_buyer')
    credit_details = relationship('CreditDetail', back_populates='credit')
    payments = relationship('Payment', back_populates='credit')

class CreditDetail(Base):
    __tablename__ = 'credit_detail'
    
    id = Column(Integer, primary_key=True, index=True)
    credit_id = Column(Integer, ForeignKey('credit.id'))
    farmer_user_id = Column(Integer, ForeignKey('user.id'))
    product_id = Column(Integer, ForeignKey('product.id'))
    quantity = Column(DECIMAL(10,3), nullable=False)
    price = Column(DECIMAL(12,2), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credit = relationship('Credit', back_populates='credit_details')

class Payment(Base):
    __tablename__ = 'payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=True)
    credit_id = Column(Integer, ForeignKey('credit.id'), nullable=True)
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'), nullable=True)
    type = Column(String(50))  # buyer_payment, refund, etc.
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='payments')
    credit = relationship('Credit', back_populates='payments')

class FarmerPayment(Base):
    __tablename__ = 'farmer_payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'))
    farmer_user_id = Column(Integer, ForeignKey('user.id'))
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_type = Column(String(50))  # advance, settlement, bonus
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'), nullable=True)
    remarks = Column(Text)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='farmer_payments')
    farmer_user = relationship('User', back_populates='farmer_payments')

# Reference Tables
class Category(Base):
    __tablename__ = 'category'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Plan(Base):
    __tablename__ = 'plan'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10,2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaymentMethod(Base):
    __tablename__ = 'payment_method'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = 'audit_log'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'))
    old_data = Column(JSON)
    new_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
