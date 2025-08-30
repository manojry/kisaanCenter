from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date

class TransactionCreate(BaseModel):
    shop_id: int = Field(..., gt=0)
    buyer_user_id: int = Field(..., gt=0)
    parent_transaction_id: Optional[int] = Field(None, gt=0)
    type: Optional[str] = Field("sale", max_length=50)
    status: Optional[str] = Field("active", max_length=50)
    commission_rate: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    commission_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    payment_status: Optional[str] = Field("pending", max_length=50)
    buyer_paid_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    farmer_paid_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    commission_confirmed: Optional[bool] = Field(False)
    completion_status: Optional[str] = Field("pending", max_length=50)
    date: date

class TransactionUpdate(BaseModel):
    type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    commission_rate: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    commission_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    payment_status: Optional[str] = Field(None, max_length=50)
    buyer_paid_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    farmer_paid_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    commission_confirmed: Optional[bool] = None
    completion_status: Optional[str] = Field(None, max_length=50)

class TransactionRead(BaseModel):
    id: int
    shop_id: int
    buyer_user_id: int
    parent_transaction_id: Optional[int] = None
    type: Optional[str] = None
    status: Optional[str] = None
    commission_rate: Optional[Decimal] = None
    commission_amount: Optional[Decimal] = None
    payment_status: Optional[str] = None
    buyer_paid_amount: Optional[Decimal] = None
    farmer_paid_amount: Optional[Decimal] = None
    commission_confirmed: Optional[bool] = None
    completion_status: Optional[str] = None
    date: date
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
    
    class Config:
        from_attributes = True

class TransactionReadWithRelations(TransactionRead):
    """Transaction read schema with relationship data"""
    buyer: Optional[dict] = None
    farmer: Optional[dict] = None
    shop: Optional[dict] = None
    items: Optional[List[dict]] = None

class TransactionSummary(BaseModel):
    total_transactions: int
    total_amount: Decimal
    pending_transactions: int
    completed_transactions: int
