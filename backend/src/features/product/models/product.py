from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, DECIMAL, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ....database import Base
from ....models import RecordStatus


class Product(Base):
    """Product model for managing agricultural products"""
    __tablename__ = 'product'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey('category.id'))
    description = Column(Text)
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

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', shop_id={self.shop_id})>"
    
    def to_dict(self):
        """Convert Product object to dictionary"""
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'name': self.name,
            'category_id': self.category_id,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }


class ProductPriceHistory(Base):
    """Product price history model for tracking price changes"""
    __tablename__ = 'product_price_history'
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), index=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    price = Column(DECIMAL(10,2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    product = relationship('Product', back_populates='price_history')
    created_by_user = relationship('User', back_populates='created_price_history')

    def __repr__(self):
        return f"<ProductPriceHistory(id={self.id}, product_id={self.product_id}, price={self.price})>"
    
    def to_dict(self):
        """Convert ProductPriceHistory object to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'created_by': self.created_by,
            'price': float(self.price) if self.price else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }


class Category(Base):
    """Product category model"""
    __tablename__ = 'category'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)

    # Relationships
    products = relationship('Product', back_populates='category')

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"
    
    def to_dict(self):
        """Convert Category object to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status.value
        }