
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql import func
from datetime import datetime
from ....models.base import Base # Assuming Base is in a central location

class ProductCategory(Base):
    __tablename__ = 'product_categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # fruits, flowers, grains, vegetables
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = relationship('Product', back_populates='category')
    
    def __repr__(self):
        return f"<ProductCategory(name='{self.name}')>"

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey('product_categories.id'), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(20), default='kg')  # kg, pieces, bundles, etc.
    
    # Superadmin managed
    is_active = Column(Boolean, default=True)
    created_by_superadmin = Column(Boolean, default=True)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship('ProductCategory', back_populates='products')
    shop_products = relationship('ShopProduct', back_populates='product')
    farmer_products = relationship('FarmerProduct', back_populates='product')
    
    def __repr__(self):
        return f"<Product(name='{self.name}', category='{self.category.name}')>"

# NEW: Shop-specific product selection
class ShopProduct(Base):
    __tablename__ = 'shop_products'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    
    # Shop-specific settings
    is_active = Column(Boolean, default=True)
    default_price = Column(DECIMAL(10,2), nullable=True)  # Shop's default selling price
    commission_rate = Column(DECIMAL(5,2), nullable=True)  # Override shop's default commission
    
    # Display settings
    display_name = Column(String(100), nullable=True)  # Custom name for this shop
    display_order = Column(Integer, default=0)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = relationship('Shop', back_populates='shop_products')
    product = relationship('Product', back_populates='shop_products')
    farmer_products = relationship('FarmerProduct', back_populates='shop_product')
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('shop_id', 'product_id', name='uq_shop_product'),
    )

# NEW: Farmer-specific product assignment
class FarmerProduct(Base):
    __tablename__ = 'farmer_products'
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    shop_product_id = Column(Integer, ForeignKey('shop_products.id'), nullable=False)
    
    # Assignment details
    assigned_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Owner/Employee who assigned
    is_active = Column(Boolean, default=True)
    
    # Farmer-specific settings
    preferred_price = Column(DECIMAL(10,2), nullable=True)  # Farmer's preferred selling price
    notes = Column(Text, nullable=True)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farmer_user = relationship('User', foreign_keys=[farmer_user_id])
    assigned_by = relationship('User', foreign_keys=[assigned_by_id])
    shop_product = relationship('ShopProduct', back_populates='farmer_products')
    product = relationship('Product', secondary='shop_products', viewonly=True)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('farmer_user_id', 'shop_product_id', name='uq_farmer_product'),
    )
    
    @hybrid_property
    def product_name(self):
        return self.shop_product.product.name
    
    @hybrid_property
    def category_name(self):
        return self.shop_product.product.category.name
