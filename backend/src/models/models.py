"""
SQLAlchemy models for KisaanCenter application
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, 
    ForeignKey, Boolean, JSON, Date, Text, Enum,
    Numeric, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base
from .enums import (
    RecordStatus, UserRole, TransactionStatus, 
    PaymentStatus, CompletionStatus, StockStatus,
    TransactionType, CreditStatus, PaymentType,
    FarmerPaymentType, BillingCycle, SubscriptionStatus
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, name="user_role", values_callable=lambda obj: [e.value.lower() for e in obj]),
        nullable=False
    )
    contact = Column(String(15))
    shop_id = Column(Integer, ForeignKey("shops.id"))
    credit_limit = Column(Numeric(12,2), default=0.00)
    status = Column(Enum(RecordStatus), default='active')
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shop = relationship("Shop", back_populates="users")
    created_users = relationship("User", backref="creator", remote_side=[id])
    transactions = relationship("Transaction", back_populates="buyer")
    farmer_stocks = relationship("FarmerStock", back_populates="farmer")
    credits = relationship("Credit", back_populates="user")

class Shop(Base):
    __tablename__ = "shops"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(Text)
    location = Column(String(255))
    contact = Column(String(15))
    commission_rate = Column(Numeric(5,2), default=0.00)
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    status = Column(
        Enum(RecordStatus, name="record_status", values_callable=lambda obj: [e.value.lower() for e in obj]),
        default='active'
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id])
    users = relationship("User", back_populates="shop", foreign_keys="User.shop_id")
    plan = relationship("Plan")
    transactions = relationship("Transaction", back_populates="shop")
    subscriptions = relationship("Subscription", back_populates="shop")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    status = Column(
        Enum(RecordStatus, name="record_status", values_callable=lambda obj: [e.value for e in obj]),
        default='active'
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Numeric(10,2))
    status = Column(
        Enum(RecordStatus, name="record_status", values_callable=lambda obj: [e.value for e in obj]),
        default='active'
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")
    farmer_stocks = relationship("FarmerStock", back_populates="product")
    transaction_items = relationship("TransactionItem", back_populates="product")

class FarmerStock(Base):
    __tablename__ = "farmer_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    declared_qty = Column(Numeric(10,3), nullable=True)
    sold_qty = Column(Numeric(10,3), default=0.000)
    balance_qty = Column(Numeric(10,3), nullable=True)
    expired_qty = Column(Numeric(10,3), default=0.000)  # New: track expired stock
    correction_qty = Column(Numeric(10,3), default=0.000)  # New: track corrections
    price = Column(Numeric(10,2), nullable=False)
    status = Column(
        Enum(StockStatus, name="stock_status", values_callable=lambda obj: [e.value for e in obj]),
        default=StockStatus.IN_STOCK
    )
    record_status = Column(
        Enum(RecordStatus, name="record_status", values_callable=lambda obj: [e.value for e in obj]),
        default='active'
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("User", back_populates="farmer_stocks")
    product = relationship("Product", back_populates="farmer_stocks")
    transaction_items = relationship("TransactionItem", back_populates="farmer_stock")
    farmer_payments = relationship("FarmerPayment", back_populates="farmer_stock")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    buyer_id = Column(Integer, ForeignKey("users.id"))
    parent_transaction_id = Column(Integer, ForeignKey("transactions.id"))
    type = Column(Enum(TransactionType), default=TransactionType.SALE)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    commission_rate = Column(Numeric(5,2), default=0.00)
    commission_amount = Column(Numeric(12,2), default=0.00)
    payment_type = Column(Enum(PaymentType), nullable=False)  # New: track payment type
    is_cancelled = Column(Boolean, default=False)  # New: support cancellation
    cancelled_at = Column(DateTime, nullable=True)  # New: support cancellation
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    buyer_paid_amount = Column(Numeric(12,2), default=0.00)
    farmer_paid_amount = Column(Numeric(12,2), default=0.00)
    commission_confirmed = Column(Boolean, default=False)
    completion_status = Column(Enum(CompletionStatus), default=CompletionStatus.PENDING)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shop = relationship("Shop", back_populates="transactions")
    buyer = relationship("User", back_populates="transactions")
    parent_transaction = relationship("Transaction", remote_side=[id], backref="child_transactions")
    items = relationship("TransactionItem", back_populates="transaction")
    payments = relationship("Payment", back_populates="transaction")
    farmer_payments = relationship("FarmerPayment", back_populates="transaction")

class TransactionItem(Base):
    __tablename__ = "transaction_items"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    farmer_id = Column(Integer, ForeignKey("users.id"))
    farmer_stock_id = Column(Integer, ForeignKey("farmer_stock.id"))
    quantity = Column(Numeric(10,3), nullable=False)
    price = Column(Numeric(10,2), nullable=False)
    status = Column(Enum(RecordStatus), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product", back_populates="transaction_items")
    farmer = relationship("User")
    farmer_stock = relationship("FarmerStock", back_populates="transaction_items")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    status = Column(Enum(RecordStatus), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    payments = relationship("Payment", back_populates="payment_method")
    farmer_payments = relationship("FarmerPayment", back_populates="payment_method")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    credit_id = Column(Integer, ForeignKey("credits.id"))
    amount = Column(Numeric(12,2), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"))
    type = Column(Enum(PaymentType), nullable=False)
    status = Column(Enum(RecordStatus), default='active')
    date = Column(Date, nullable=False)
    reference_number = Column(String(100))
    notes = Column(Text)
    processed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="payments")
    credit = relationship("Credit", back_populates="payments")
    payment_method = relationship("PaymentMethod", back_populates="payments")
    processor = relationship("User")

class FarmerPayment(Base):
    __tablename__ = "farmer_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    farmer_stock_id = Column(Integer, ForeignKey("farmer_stock.id"))
    farmer_user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Numeric(12,2), nullable=False)
    payment_type = Column(Enum(FarmerPaymentType), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"))
    remarks = Column(Text)
    date = Column(Date, nullable=False)
    reference_number = Column(String(100))
    approved_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(RecordStatus), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="farmer_payments")
    farmer_stock = relationship("FarmerStock", back_populates="farmer_payments")
    farmer = relationship("User", foreign_keys=[farmer_user_id])
    payment_method = relationship("PaymentMethod", back_populates="farmer_payments")
    approver = relationship("User", foreign_keys=[approved_by])

class Credit(Base):
    __tablename__ = "credits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Numeric(12,2), nullable=False)
    status = Column(Enum(CreditStatus), default=CreditStatus.OUTSTANDING)
    record_status = Column(Enum(RecordStatus), default='active')
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="credits")
    payments = relationship("Payment", back_populates="credit")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    monthly_price = Column(Numeric(10,2), nullable=False)
    max_farmers = Column(Integer, nullable=False)
    max_buyers = Column(Integer, nullable=False)
    max_transactions = Column(Integer, nullable=False)
    data_retention_months = Column(Integer, nullable=False)
    features = Column(JSON)
    status = Column(Enum(RecordStatus), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shops = relationship("Shop", back_populates="plan")
    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY)
# FarmerLedger (new model for farmer-wise ledger aggregation)
class FarmerLedger(Base):
    __tablename__ = "farmer_ledger"
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    balance = Column(Numeric(12,2), default=0.00)
    last_settlement = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    farmer = relationship("User")
    auto_renew = Column(Boolean, default=True)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    amount = Column(Numeric(10,2))
    discount_amount = Column(Numeric(10,2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shop = relationship("Shop", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
