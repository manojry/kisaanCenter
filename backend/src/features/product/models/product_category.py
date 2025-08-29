
class ProductCategory(Base):
    __tablename__ = 'product_categories'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    products = relationship('Product', back_populates='category')
