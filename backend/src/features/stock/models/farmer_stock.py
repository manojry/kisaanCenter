
class FarmerStock(Base):
    __tablename__ = 'farmer_stock'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    
    # Business Fields
    quantity = Column(DECIMAL(10,3), nullable=False)
    unit_price = Column(DECIMAL(10,2), nullable=False)
    total_value = Column(DECIMAL(12,2), nullable=False)
    
    # System Fields
    entry_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    farmer_user = relationship('User', back_populates='farmer_stocks')
    product = relationship('Product', back_populates='farmer_stocks')
    shop = relationship('Shop', back_populates='farmer_stocks')
