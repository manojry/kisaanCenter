from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class FarmerLedgerBase(BaseModel):
    farmer_id: int
    balance: Decimal = Field(default=0.00)
    last_settlement: Optional[datetime] = None

class FarmerLedgerRead(FarmerLedgerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
