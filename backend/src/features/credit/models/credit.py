
class Credit(Base):
    __tablename__ = 'credits'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=False)
    buyer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    
    # Business Fields
    total_amount = Column(DECIMAL(12,2), nullable=False)
    paid_amount = Column(DECIMAL(12,2), default=0.00)
    outstanding_amount = Column(DECIMAL(12,2), nullable=False)
    
    # Status and Dates
    status = Column(Enum(CreditStatus), default=CreditStatus.OUTSTANDING)
    due_date = Column(Date)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship('Transaction', back_populates='credits')
    buyer_user = relationship('User', back_populates='credits_as_buyer')
    shop = relationship('Shop', back_populates='credits')
    credit_details = relationship('CreditDetail', back_populates='credit')

class CreditDetail(Base):
    __tablename__ = 'credit_details'
    
    # Primary Fields
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    credit_id = Column(Integer, ForeignKey('credits.id'), nullable=False)
    farmer_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Business Fields
    amount = Column(DECIMAL(12,2), nullable=False)
    paid_amount = Column(DECIMAL(12,2), default=0.00)
    outstanding_amount = Column(DECIMAL(12,2), nullable=False)
    
    # Status
    status = Column(Enum(CreditStatus), default=CreditStatus.OUTSTANDING)
    
    # System Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credit = relationship('Credit', back_populates='credit_details')
    farmer_user = relationship('User', back_populates='credit_details')
