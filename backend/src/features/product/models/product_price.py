
class ProductPrice(Base):
    __tablename__ = 'product_prices'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Business Fields
    price = Column(DECIMAL(10,2), nullable=False)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship('Product', back_populates='price_history')
    creator = relationship('User')
