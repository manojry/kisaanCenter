from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
from ..models.enums import RecordStatus

class FarmerStockBase(BaseModel):
    farmer_user_id: int
    product_id: int
    declared_qty: Optional[Decimal] = None
    sold_qty: Optional[Decimal] = Field(default=0.000)
    balance_qty: Optional[Decimal] = None
    expired_qty: Optional[Decimal] = Field(default=0.000)  # New
    correction_qty: Optional[Decimal] = Field(default=0.000)  # New
    price: Decimal
    record_status: Optional[RecordStatus] = None

class FarmerStockCreate(FarmerStockBase):
    pass

class FarmerStockUpdate(BaseModel):
    declared_qty: Optional[Decimal] = None
    sold_qty: Optional[Decimal] = None
    balance_qty: Optional[Decimal] = None
    price: Optional[Decimal] = None
    record_status: Optional[RecordStatus] = None

class FarmerStockRead(FarmerStockBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
