from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class ShopBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = Field(None, max_length=20)
    commission_rate: Optional[Decimal] = Field(default=5.00, ge=0, le=100)

class ShopCreate(ShopBase):
    owner_user_id: int
    plan_id: Optional[int] = None

class ShopUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = Field(None, max_length=20)
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    status: Optional[str] = None

class ShopRead(ShopBase):
    id: int
    owner_user_id: int
    plan_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
