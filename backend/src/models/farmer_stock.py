from sqlalchemy import Column, Integer, String, DateTime, func, DECIMAL, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .enums import StockStatus

class FarmerStock(Base):
    __tablename__ = "farmer_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    farmer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(DECIMAL(10, 3), nullable=False)
    status = Column(Enum(StockStatus), nullable=False, default=StockStatus.IN_STOCK)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop")
    farmer = relationship("User", back_populates="farmer_stocks")
    product = relationship("Product")
    farmer_payments = relationship("FarmerPayment", back_populates="farmer_stock")