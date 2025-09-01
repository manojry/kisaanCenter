from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime, date

class CreditBase(BaseModel):
    transaction_id: int
    buyer_user_id: int
    shop_id: int
    total_amount: Decimal = Field(..., gt=0)
    due_date: Optional[date] = None

class CreditCreate(CreditBase):
    pass

class CreditUpdate(BaseModel):
    paid_amount: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None
    status: Optional[str] = None

class CreditRead(CreditBase):
    id: int
    paid_amount: Decimal
    outstanding_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
