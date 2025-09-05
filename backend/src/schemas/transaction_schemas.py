
from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime
from ..models.enums import TransactionStatus, PaymentStatus

# Transaction base class
class TransactionBase(BaseModel):
    shop_id: int
    buyer_user_id: int
    farmer_user_id: int
    commission_rate: Decimal
    parent_transaction_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    items: List[dict] = []
    
class TransactionUpdate(BaseModel):
    commission_rate: Optional[Decimal] = None
    commission_confirmed: Optional[bool] = None
    status: Optional[str] = None

class TransactionRead(TransactionBase):
    id: int
    status: str
    commission_amount: Optional[Decimal] = None
    payment_status: str
    buyer_paid_amount: Optional[Decimal] = None
    farmer_paid_amount: Optional[Decimal] = None
    commission_confirmed: bool = False
    date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TransactionReadWithRelations(TransactionRead):
    buyer: Optional[dict] = None
    items: List[dict] = []
    payments: List[dict] = []
    credits: List[dict] = []
    farmer_payments: List[dict] = []

# Summary schema
class TransactionSummary(BaseModel):
    total_transactions: int
    total_amount: Decimal
    pending_amount: Decimal
    completed_amount: Decimal

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
