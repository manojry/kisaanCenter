from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    category_id: int
    shop_id: int
    image_url: Optional[str] = Field(None, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    base_price: Optional[Decimal] = Field(None, ge=0)

class ProductCreate(ProductBase):
    initial_stock: Optional[float] = Field(None, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    shop_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    base_price: Optional[Decimal] = Field(None, ge=0)

class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
