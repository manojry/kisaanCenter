from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func, Numeric, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .enums import OrderStatus

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(OrderStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=OrderStatus.PENDING.value)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    product = relationship("Product")
    shop = relationship("Shop")
    buyer = relationship("User")
