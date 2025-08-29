
class Plan(Base):
    __tablename__ = 'plans'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Pricing Fields
    monthly_price = Column(DECIMAL(10,2), nullable=False)
    quarterly_price = Column(DECIMAL(10,2))
    yearly_price = Column(DECIMAL(10,2))
    
    # Limits
    max_farmers = Column(Integer, nullable=False)
    max_buyers = Column(Integer, nullable=False)
    max_transactions = Column(Integer, nullable=False)
    data_retention_months = Column(Integer, default=12)
    
    # Features (JSON field)
    features = Column(JSON)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    shops = relationship('Shop', back_populates='plan')
