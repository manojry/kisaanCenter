from sqlalchemy import Column, Integer, Numeric, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from .base import Base

class ShopProduct(Base):
    """
    Junction table to link shops with products they choose to sell
    Allows shops to select subset of global products and set custom prices
    """
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    custom_price = Column(Numeric(12, 2), nullable=True)  # Owner can override product price
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())

    # Ensure unique shop-product combination
    __table_args__ = (UniqueConstraint('shop_id', 'product_id', name='uq_shop_product'),)

    # Relationships
    shop = relationship("Shop", back_populates="shop_products")
    product = relationship("Product", back_populates="shop_products")

    def __repr__(self):
        return f"<ShopProduct(shop_id={self.shop_id}, product_id={self.product_id}, active={self.is_active})>"

    @property
    def effective_price(self):
        """Return custom price if set, otherwise product's default price"""
        return self.custom_price or (self.product.price if self.product else 0)
