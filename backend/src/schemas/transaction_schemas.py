from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class TransactionCreate(BaseModel):
    buyer_id: int = Field(..., gt=0)
    shop_id: int = Field(..., gt=0)
    farmer_id: Optional[int] = Field(None, gt=0)
    total_amount: Decimal = Field(..., gt=0, decimal_places=2)
    commission: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[str] = Field("pending", max_length=20)
    payment_status: Optional[str] = Field("pending", max_length=20)
    completion_status: Optional[str] = Field("pending", max_length=20)

class TransactionUpdate(BaseModel):
    total_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    commission: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[str] = Field(None, max_length=20)
    payment_status: Optional[str] = Field(None, max_length=20)
    completion_status: Optional[str] = Field(None, max_length=20)

class TransactionRead(BaseModel):
    id: int
    buyer_id: int
    shop_id: int
    farmer_id: Optional[int] = None
    total_amount: Decimal
    commission: Optional[Decimal] = None
    status: str
    payment_status: str
    completion_status: str
    transaction_date: datetime
    created_at: datetime
    updated_at: datetime
    
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
