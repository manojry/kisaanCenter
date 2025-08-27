"""
Market Management System - SQLAlchemy Models

This module contains the core database models aligned with the ERD specification.
Models support the three-party transaction completion workflow and financial dashboards.

Related Documentation:
- ERD: /Documents/Architecture/ERD.md
- Database Schema: /Documents/Architecture/Database_Schema.md  
- Business Rules: /Documents/Architecture/Business_Rules.md
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, DECIMAL, Enum, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import os
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.types import JSON as SQLiteJSON
from datetime import datetime
import enum

Base = declarative_base()


# Enums for type safety
class UserRole(enum.Enum):
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    FARMER = "farmer"
    BUYER = "buyer"
    EMPLOYEE = "employee"

class TransactionType(enum.Enum):
    SALE = "sale"
    RETURN = "return"
    ADJUSTMENT = "adjustment"

class TransactionStatus(enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class CompletionStatus(enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETE = "complete"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"

class PaymentType(enum.Enum):
    PAYMENT = "payment"
    ADVANCE = "advance"
    REFUND = "refund"

class FarmerPaymentType(enum.Enum):
    SETTLEMENT = "settlement"
    ADVANCE = "advance"

class RecordStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class StockStatus(enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    RETURNED = "returned"
    DISCARDED = "discarded"

class CreditStatus(enum.Enum):
    OUTSTANDING = "outstanding"
    PARTIAL = "partial"
    SETTLED = "settled"

class CommissionRuleType(enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    TIERED = "tiered"

class AdjustmentType(enum.Enum):
    INCREASE = "increase"
    DECREASE = "decrease"
    CORRECTION = "correction"

class AuditAction(enum.Enum):
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

# Core Entities

class Superadmin(Base):
    __tablename__ = 'superadmin'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    contact = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

    # Relationships
    created_shops = relationship('Shop', back_populates='creator')
    controlled_features = relationship('FeatureControl', back_populates='controller')
    subscription_changes = relationship('SubscriptionHistory', back_populates='changer')

class BillingCycle(enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class PaymentStatus(enum.Enum):
    PAID = "paid"
    PENDING = "pending"
    FAILED = "failed"
    OVERDUE = "overdue"

class LimitType(enum.Enum):
    COUNT = "count"
    DAYS = "days"
    MONTHS = "months"
    PERCENTAGE = "percentage"

class ResetCycle(enum.Enum):
    DAILY = "daily"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class Plan(Base):
    __tablename__ = 'plan'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    monthly_price = Column(DECIMAL(10,2), nullable=False)
    quarterly_price = Column(DECIMAL(10,2))  # With 5% discount
    yearly_price = Column(DECIMAL(10,2))     # With 15% discount
    max_farmers = Column(Integer, default=10)
    max_buyers = Column(Integer, default=20)
    max_transactions = Column(Integer, default=1000)
    data_retention_months = Column(Integer, default=6)
    features = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

    # Relationships
    shops = relationship('Shop', back_populates='plan')
    plan_features = relationship('PlanFeature', back_populates='plan')
    subscriptions = relationship('Subscription', back_populates='plan')

# Stub PlanFeature model to resolve relationship
class PlanFeature(Base):
    __tablename__ = 'plan_feature'
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey('plan.id'))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

    plan = relationship('Plan', back_populates='plan_features')

class Shop(Base):
    __tablename__ = 'shop'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    location = Column(String(200))
    plan_id = Column(Integer, ForeignKey('plan.id'))
    created_by = Column(Integer, ForeignKey('superadmin.id'))
    owner_user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    plan = relationship('Plan', back_populates='shops')
    creator = relationship('Superadmin', back_populates='created_shops')
    owner = relationship('User', foreign_keys=[owner_user_id], back_populates='owned_shops')
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

# Stub StockAdjustment model to resolve relationship
class StockAdjustment(Base):
    __tablename__ = 'stock_adjustment'
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    adjustment_type = Column(String(50))
    amount = Column(DECIMAL(12,2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

    shop = relationship('Shop', back_populates='stock_adjustments')
    created_by_user = relationship('User', back_populates='created_adjustments')
    farmer_stock = relationship('FarmerStock', back_populates='stock_adjustments')

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    shop_id = Column(Integer, ForeignKey('shop.id'))
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

class Category(Base):
    __tablename__ = 'category'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship('Product', back_populates='category')

class Product(Base):
    __tablename__ = 'product'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey('category.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    shop = relationship('Shop', back_populates='products')
    category = relationship('Category', back_populates='products')
    farmer_stocks = relationship('FarmerStock', back_populates='product')
    transaction_items = relationship('TransactionItem', back_populates='product')
    commission_rules = relationship('CommissionRule', back_populates='product')
    credit_details = relationship('CreditDetail', back_populates='product')
    price_history = relationship('ProductPriceHistory', back_populates='product')

class ProductPriceHistory(Base):
    __tablename__ = 'product_price_history'
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    price = Column(DECIMAL(10,2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    product = relationship('Product', back_populates='price_history')
    created_by_user = relationship('User', back_populates='created_price_history')

class FarmerStock(Base):
    __tablename__ = 'farmer_stock'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    quantity = Column(DECIMAL(10,2), nullable=False)
    status = Column(Enum(StockStatus), default=StockStatus.ACTIVE)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='farmer_stocks')
    farmer_user = relationship('User', back_populates='farmer_stocks')
    product = relationship('Product', back_populates='farmer_stocks')
    transaction_items = relationship('TransactionItem', back_populates='farmer_stock')
    farmer_payments = relationship('FarmerPayment', back_populates='farmer_stock')
    stock_adjustments = relationship('StockAdjustment', back_populates='farmer_stock')

class Transaction(Base):
    __tablename__ = 'transaction'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    buyer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    parent_transaction_id = Column(Integer, ForeignKey('transaction.id'))
    type = Column(Enum(TransactionType), default=TransactionType.SALE)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.ACTIVE)
    commission_rate = Column(DECIMAL(5,2), default=0.00)
    commission_amount = Column(DECIMAL(12,2), default=0.00)
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

class TransactionItem(Base):
    __tablename__ = 'transaction_item'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'), nullable=False)
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

class Credit(Base):
    __tablename__ = 'credit'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    buyer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(DECIMAL(12,2), nullable=False)
    status = Column(Enum(CreditStatus), default=CreditStatus.OUTSTANDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='credits')
    buyer_user = relationship('User', back_populates='credits_as_buyer')
    credit_details = relationship('CreditDetail', back_populates='credit')
    payments = relationship('Payment', back_populates='credit')

class CreditDetail(Base):
    __tablename__ = 'credit_detail'
    
    id = Column(Integer, primary_key=True, index=True)
    credit_id = Column(Integer, ForeignKey('credit.id'), nullable=False)
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    quantity = Column(DECIMAL(10,2), nullable=False)
    price = Column(DECIMAL(10,2), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credit = relationship('Credit', back_populates='credit_details')
    farmer_user = relationship('User', back_populates='credit_details')
    product = relationship('Product', back_populates='credit_details')

class PaymentMethod(Base):
    __tablename__ = 'payment_method'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    payments = relationship('Payment', back_populates='payment_method')
    farmer_payments = relationship('FarmerPayment', back_populates='payment_method')

class Payment(Base):
    __tablename__ = 'payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    credit_id = Column(Integer, ForeignKey('credit.id'))
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'))
    type = Column(Enum(PaymentType), nullable=False)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='payments')
    credit = relationship('Credit', back_populates='payments')
    payment_method = relationship('PaymentMethod', back_populates='payments')

class FarmerPayment(Base):
    __tablename__ = 'farmer_payment'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transaction.id'))
    farmer_stock_id = Column(Integer, ForeignKey('farmer_stock.id'))
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_type = Column(Enum(FarmerPaymentType), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_method.id'))
    remarks = Column(Text)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='farmer_payments')
    farmer_stock = relationship('FarmerStock', back_populates='farmer_payments')
    farmer_user = relationship('User', back_populates='farmer_payments')
    payment_method = relationship('PaymentMethod', back_populates='farmer_payments')

class CommissionRule(Base):
    __tablename__ = 'commission_rule'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'))
    rule_type = Column(Enum(CommissionRuleType), nullable=False)
    rate = Column(DECIMAL(10,4), nullable=False)
    min_qty = Column(DECIMAL(10,2))
    max_qty = Column(DECIMAL(10,2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='commission_rules')
    product = relationship('Product', back_populates='commission_rules')

class ExpenseCategory(Base):
    __tablename__ = 'expense_category'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10,2), nullable=False)
    billing_cycle = Column(String(20), default='monthly')
    max_users = Column(Integer, default=10)
    max_transactions = Column(Integer, default=1000)
    features = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(20), default='active')

class Expense(Base):
    __tablename__ = 'expense'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('expense_category.id'))
    amount = Column(DECIMAL(12,2), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))

    # Relationships
    shop = relationship('Shop', back_populates='expenses')
    created_by_user = relationship('User', back_populates='created_expenses')

class AuditLog(Base):
    __tablename__ = 'audit_log'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'))
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'))
    old_data = Column(JSON)
    new_data = Column(JSON)
    action = Column(Enum(AuditAction), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop')
    user = relationship('User', back_populates='audit_logs')

# Subscription Management Models

class Subscription(Base):
    __tablename__ = 'subscription'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    plan_id = Column(Integer, ForeignKey('plan.id'), nullable=False)
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    auto_renew = Column(Boolean, default=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(DECIMAL(10,2), nullable=False)
    discount_amount = Column(DECIMAL(10,2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='subscriptions')
    plan = relationship('Plan', back_populates='subscriptions')
    subscription_history = relationship('SubscriptionHistory', back_populates='subscription')

class FeatureControl(Base):
    __tablename__ = 'feature_control'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    feature_name = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=True)
    limit_value = Column(Integer)
    limit_type = Column(Enum(LimitType))
    controlled_by = Column(Integer, ForeignKey('superadmin.id'))
    reason = Column(Text)
    effective_from = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='feature_controls')
    controller = relationship('Superadmin', back_populates='controlled_features')

class UsageTracking(Base):
    __tablename__ = 'usage_tracking'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    feature_name = Column(String(100), nullable=False)
    usage_count = Column(Integer, default=0)
    usage_date = Column(Date, nullable=False)
    reset_cycle = Column(Enum(ResetCycle), default=ResetCycle.MONTHLY)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='usage_tracking')

class SubscriptionHistory(Base):
    __tablename__ = 'subscription_history'
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey('subscription.id'), nullable=False)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    previous_plan_id = Column(Integer, ForeignKey('plan.id'))
    new_plan_id = Column(Integer, ForeignKey('plan.id'), nullable=False)
    change_reason = Column(Text)
    changed_by = Column(Integer, ForeignKey('superadmin.id'))
    effective_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subscription = relationship('Subscription', back_populates='subscription_history')
    shop = relationship('Shop', back_populates='subscription_history')
    previous_plan = relationship('Plan', foreign_keys=[previous_plan_id])
    new_plan = relationship('Plan', foreign_keys=[new_plan_id])
    changer = relationship('Superadmin', back_populates='subscription_changes')
