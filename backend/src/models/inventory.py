from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shop.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    status = Column(String, default="active")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="inventory_items")
    shop = relationship("Shop", back_populates="inventory_items")
