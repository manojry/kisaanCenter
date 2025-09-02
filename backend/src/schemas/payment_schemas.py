from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime, date

class PaymentBase(BaseModel):
    transaction_id: int
    amount: Decimal = Field(..., gt=0)
    payment_method_id: int
    type: str
    date: date
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class PaymentCreate(PaymentBase):
    credit_id: Optional[int] = None
    processed_by: Optional[int] = None

class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    payment_method_id: Optional[int] = None
    type: Optional[str] = None
    date: Optional[date] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class PaymentRead(PaymentBase):
    id: int
    credit_id: Optional[int] = None
    processed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
