
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, DECIMAL, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

class ProductScope(enum.Enum):
    GLOBAL = "global"      # Created by superadmin, available to all shops
    SHOP_SPECIFIC = "shop_specific"  # Created by shop owner, only for their shop

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
    assigned_shops = relationship(
        'Shop',
        secondary='shop_category_assignments',
        back_populates='assigned_categories'
    )
    
    def __repr__(self):
        return f"<ProductCategory(name='{self.name}')>"

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey('product_categories.id'), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(20), default='kg')
    
    # Enhanced scope management
    scope = Column(Enum(ProductScope), default=ProductScope.GLOBAL)
    created_by_superadmin = Column(Boolean, default=False)
    created_by_shop_id = Column(Integer, ForeignKey('shops.id'), nullable=True)  # NULL for global products
    
    # System fields
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship('ProductCategory', back_populates='products')
    created_by_shop = relationship('Shop', foreign_keys=[created_by_shop_id])
    shop_products = relationship('ShopProduct', back_populates='product')
    
    # Constraints
    __table_args__ = (
        # Global products must have created_by_superadmin=True and created_by_shop_id=NULL
        # Shop-specific products must have created_by_shop_id set
        UniqueConstraint('name', 'category_id', 'created_by_shop_id', name='unique_product_per_shop_category'),
    )
    
    def __repr__(self):
        return f"<Product(name='{self.name}', category='{self.category.name}')>"

# NEW: Shop-specific product selection
class ShopProduct(Base):
    __tablename__ = 'shop_products'
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey('shops.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    
    # Shop-specific pricing and settings
    shop_price = Column(DECIMAL(10, 2), nullable=True)  # Shop can set their own price
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    # System fields
    added_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    shop = relationship('Shop', back_populates='shop_products')
    product = relationship('Product', back_populates='shop_products')
    
    __table_args__ = (
        UniqueConstraint('shop_id', 'product_id', name='unique_shop_product'),
    )

class Shop(Base):
    __tablename__ = 'shops'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship('User')
    shop_products = relationship('ShopProduct', back_populates='shop')
    assigned_categories = relationship(
        'ProductCategory',
        secondary='shop_category_assignments',
        back_populates='assigned_shops'
    )

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    
    # System fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
