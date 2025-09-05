from pydantic import BaseModel, Field
from typing import Optional, List, Annotated
from decimal import Decimal
from datetime import datetime

# ShopProduct schemas
class ShopProductBase(BaseModel):
    product_id: int
    is_active: bool = True
    custom_price: Optional[Decimal] = Field(None, ge=0)

class ShopProductCreate(ShopProductBase):
    pass

class ShopProductUpdate(BaseModel):
    is_active: Optional[bool] = None
    custom_price: Optional[Decimal] = Field(None, ge=0)

class ShopProductRead(ShopProductBase):
    id: int
    shop_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ShopProductReadWithProduct(ShopProductRead):
    product: Optional[dict] = None
    effective_price: Optional[Decimal] = None

# Quick transaction creation schema for owners
class QuickTransactionCreate(BaseModel):
    farmer_id: int = Field(..., description="Farmer providing the goods")
    buyer_id: int = Field(..., description="Buyer purchasing the goods")
    product_id: int = Field(..., description="Product being sold")
    price_per_kg: Decimal = Field(..., gt=0, description="Price per kilogram")
    total_weight_kg: Decimal = Field(..., gt=0, description="Total weight in kg")
    commission_received: bool = Field(default=False, description="Whether commission is received")
    farmer_payment_amount: Optional[Decimal] = Field(None, ge=0, description="Amount paid to farmer")
    buyer_payment_amount: Optional[Decimal] = Field(None, ge=0, description="Amount paid by buyer")

class QuickTransactionResponse(BaseModel):
    transaction_id: int
    total_amount: Decimal
    commission_amount: Decimal
    farmer_amount: Decimal
    buyer_amount: Decimal
    farmer_paid: Decimal
    farmer_unpaid: Decimal
    buyer_paid: Decimal  
    buyer_unpaid: Decimal
    payment_status: str

# Owner password reset schema  
class OwnerPasswordReset(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

# Batch product assignment for shop
class BatchShopProductCreate(BaseModel):
    product_ids: List[int] = Field(..., description="List of product IDs to assign to shop")
    default_active: bool = Field(True, description="Default active status for all products")

class ShopCommissionUpdate(BaseModel):
    commission_rate: Decimal = Field(..., ge=0, le=100, description="Commission rate percentage (0-100)")
