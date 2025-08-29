from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from ....schemas import BaseSchema, TimestampMixin


class ShopBase(BaseModel):
    """Base shop schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Shop name")
    description: Optional[str] = Field(None, description="Shop description")
    address: Optional[str] = Field(None, description="Shop address")
    contact: Optional[str] = Field(None, max_length=20, description="Contact information")
    commission_rate: Optional[Decimal] = Field(default=5.00, ge=0, le=100, description="Commission rate percentage")


class ShopCreate(ShopBase):
    """Shop creation schema"""
    owner_user_id: int
    plan_id: Optional[int] = Field(None, description="Subscription plan ID")


class ShopUpdate(BaseModel):
    """Shop update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Shop name")
    description: Optional[str] = Field(None, description="Shop description")
    address: Optional[str] = Field(None, description="Shop address")
    contact: Optional[str] = Field(None, max_length=20, description="Contact information")
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Commission rate percentage")
    status: Optional[str] = Field(None, description="Shop status")


class ShopRead(ShopBase, TimestampMixin):
    """Shop read schema"""
    id: int
    owner_user_id: int
    plan_id: Optional[int] = Field(None, description="Subscription plan ID")
    status: str
    
    class Config:
        from_attributes = True


class ShopReadWithRelations(ShopRead):
    """Shop read schema with relationships"""
    owner: Optional["UserRead"] = Field(None, description="Owner user information")
    users: List["UserRead"] = Field([], description="List of users associated with the shop")
    products: List["ProductRead"] = Field([], description="List of products in the shop")
    transactions: List["TransactionRead"] = Field([], description="List of transactions in the shop")


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
