from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ....schemas import BaseSchema, TimestampMixin


class ShopBase(BaseSchema):
    """Base shop schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Shop name")
    location: Optional[str] = Field(None, max_length=200, description="Shop location")
    plan_id: Optional[int] = Field(None, description="Subscription plan ID")


class ShopCreate(ShopBase):
    """Shop creation schema"""
    created_by: Optional[int] = Field(None, description="Creator ID")
    owner_user_id: Optional[int] = Field(None, description="Owner user ID")


class ShopUpdate(BaseModel):
    """Shop update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Shop name")
    location: Optional[str] = Field(None, max_length=200, description="Shop location")
    plan_id: Optional[int] = Field(None, description="Subscription plan ID")
    owner_user_id: Optional[int] = Field(None, description="Owner user ID")


class ShopRead(ShopBase, TimestampMixin):
    """Shop read schema"""
    id: int
    created_by: Optional[int] = None
    owner_user_id: Optional[int] = None
    status: str
    
    class Config:
        from_attributes = True


class ShopReadWithRelations(ShopRead):
    """Shop read schema with relationships"""
    users: List["UserRead"] = []
    products: List["ProductRead"] = []
    transactions: List["TransactionRead"] = []


class ShopAnalytics(BaseModel):
    """Shop analytics schema"""
    shop_id: int
    total_users: int
    total_products: int
    total_transactions: int
    analytics_date: str


class ShopOwnerInfo(BaseModel):
    """Shop owner information schema"""
    shop_id: int
    shop_name: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True