from sqlalchemy import Column, Integer, ForeignKey
from .base import Base

class ShopCategory(Base):
    __tablename__ = 'shop_categories'
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey('shops.id'))
    category_id = Column(Integer, ForeignKey('categories.id'))
    # You can add more fields if needed, e.g. is_active, created_at, etc.
