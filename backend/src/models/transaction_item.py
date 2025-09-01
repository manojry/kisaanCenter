
class TransactionItem(Base):
    __tablename__ = "transaction_items"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Added farmer reference
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(DECIMAL(10, 3), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    total = Column(DECIMAL(10, 2), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transaction = relationship("Transaction", back_populates="items")
    farmer = relationship("User", foreign_keys=[farmer_id])
    product = relationship("Product", back_populates="transaction_items")
