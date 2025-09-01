
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date

class TransactionItemRequest(BaseModel):
    product_id: int
    quantity: float
    rate: float

class QuickSaleRequest(BaseModel):
    shop_id: int
    farmer_id: int
    buyer_id: int
    items: List[TransactionItemRequest]
    payment_mode: str = "cash"  # cash or credit
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    shop_id: int
    buyer_id: int
    total_amount: float
    commission_amount: float
    payment_status: str
    date: date
    items: List[dict]
    
    class Config:
        from_attributes = True

class TransactionCancelRequest(BaseModel):
    reason: str
    cancelled_by: int
