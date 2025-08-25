
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Shop(Base):
    __tablename__ = 'shops'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    address = Column(String(255))
    farmers = relationship('Farmer', back_populates='shop')
    buyers = relationship('Buyer', back_populates='shop')
    transactions = relationship('Transaction', back_populates='shop')

class Farmer(Base):
    __tablename__ = 'farmers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(50))
    shop_id = Column(Integer, ForeignKey('shops.id'))
    shop = relationship('Shop', back_populates='farmers')
    transactions = relationship('Transaction', back_populates='farmer')
    payments = relationship('Payment', back_populates='farmer')
    credits = relationship('Credit', back_populates='farmer')

class Buyer(Base):
    __tablename__ = 'buyers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(50))
    shop_id = Column(Integer, ForeignKey('shops.id'))
    shop = relationship('Shop', back_populates='buyers')
    transactions = relationship('Transaction', back_populates='buyer')
    payments = relationship('Payment', back_populates='buyer')
    credits = relationship('Credit', back_populates='buyer')

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    unit = Column(String(20))
    description = Column(Text)
    transactions = relationship('Transaction', back_populates='product')

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shops.id'))
    farmer_id = Column(Integer, ForeignKey('farmers.id'))
    buyer_id = Column(Integer, ForeignKey('buyers.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Float, nullable=False)
    price = Column(DECIMAL(10,2), nullable=False)
    commission = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    paid_to_farmer = Column(Boolean, default=False)
    shop = relationship('Shop', back_populates='transactions')
    farmer = relationship('Farmer', back_populates='transactions')
    buyer = relationship('Buyer', back_populates='transactions')
    product = relationship('Product', back_populates='transactions')

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey('farmers.id'))
    buyer_id = Column(Integer, ForeignKey('buyers.id'), nullable=True)
    amount = Column(DECIMAL(10,2), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    method = Column(String(50))
    remarks = Column(Text)
    farmer = relationship('Farmer', back_populates='payments')
    buyer = relationship('Buyer', back_populates='payments')

class Credit(Base):
    __tablename__ = 'credits'
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey('farmers.id'))
    buyer_id = Column(Integer, ForeignKey('buyers.id'), nullable=True)
    amount = Column(DECIMAL(10,2), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    remarks = Column(Text)
    farmer = relationship('Farmer', back_populates='credits')
    buyer = relationship('Buyer', back_populates='credits')

class Commission(Base):
    __tablename__ = 'commissions'
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transactions.id'))
    rate = Column(Float, nullable=False)
    amount = Column(DECIMAL(10,2), nullable=False)
    transaction = relationship('Transaction')
