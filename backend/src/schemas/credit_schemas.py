from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class CreditCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    shop_id: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0)
    credit_type: Optional[str] = Field("buyer_credit", max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field("active", max_length=20)

class CreditUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    credit_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=20)

class CreditRead(BaseModel):
    id: int
    user_id: int
    shop_id: int
    amount: Decimal
    credit_type: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CreditReadWithRelations(CreditRead):
    """Credit read schema with relationship data"""
    user: Optional[dict] = None
    shop: Optional[dict] = None
