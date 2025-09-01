
class Shop(Base):
    __tablename__ = 'shops'
    
    # ... existing fields
    
    # Category assignment by superadmin
    assigned_categories = relationship(
        'ProductCategory',
        secondary='shop_category_assignments',
        back_populates='assigned_shops'
    )
    
    # Products available to this shop
    shop_products = relationship('ShopProduct', back_populates='shop')

# Junction table for shop-category assignments
class ShopCategoryAssignment(Base):
    __tablename__ = 'shop_category_assignments'
    
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey('shops.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('product_categories.id'), nullable=False)
    assigned_by_superadmin_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        UniqueConstraint('shop_id', 'category_id', name='unique_shop_category'),
    )
