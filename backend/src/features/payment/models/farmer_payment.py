
class FarmerPayment(Base):
    __tablename__ = 'farmer_payments'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=False)
    farmer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    shop_id = Column(Integer, ForeignKey('shops.id'), nullable=False)
    
    # Business Fields
    amount = Column(DECIMAL(12,2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=False)
    reference_number = Column(String(100))
    notes = Column(Text)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(RecordStatus), default=RecordStatus.ACTIVE)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='farmer_payments')
    farmer_user = relationship('User', back_populates='farmer_payments')
    shop = relationship('Shop', back_populates='farmer_payments')
