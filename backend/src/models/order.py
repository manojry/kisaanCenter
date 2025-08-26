from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func, Numeric
from sqlalchemy.orm import relationship
from ..database import Base

class Order(Base):
    __tablename__ = "order"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shop.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    product = relationship("Product")
    shop = relationship("Shop")
    buyer = relationship("User")
