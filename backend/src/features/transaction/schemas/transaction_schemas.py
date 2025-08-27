from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from datetime import date as DateType
from decimal import Decimal
from ....schemas import BaseSchema, TimestampMixin


class TransactionItemBase(BaseModel):
    """Base transaction item schema"""
    product_id: int = Field(..., description="Product ID")
    farmer_stock_id: Optional[int] = Field(None, description="Farmer stock ID")
    quantity: Decimal = Field(..., gt=0, description="Quantity")
    price: Decimal = Field(..., ge=0, description="Unit price")


class TransactionItemCreate(TransactionItemBase):
    """Transaction item creation schema"""
    pass


class TransactionItemRead(TransactionItemBase):
    """Transaction item read schema"""
    id: int
    transaction_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TransactionBase(BaseSchema):
    """Base transaction schema"""
    shop_id: int = Field(..., description="Shop ID")
    buyer_user_id: int = Field(..., description="Buyer user ID")
    transaction_type: str = Field(default="sale", description="Transaction type")
    commission_rate: Decimal = Field(default=0.0, ge=0, le=100, description="Commission rate percentage")
    parent_transaction_id: Optional[int] = Field(None, description="Parent transaction ID for linked transactions")


class TransactionCreate(TransactionBase):
    """Transaction creation schema"""
    transaction_items: List[TransactionItemCreate] = Field(default=[], description="Transaction items")
    date: Optional[DateType] = Field(None, description="Transaction date (defaults to today)")


class TransactionUpdate(BaseModel):
    """Transaction update schema"""
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Commission rate percentage")
    buyer_paid_amount: Optional[Decimal] = Field(None, ge=0, description="Amount paid by buyer")
    farmer_paid_amount: Optional[Decimal] = Field(None, ge=0, description="Amount paid to farmer")
    commission_confirmed: Optional[bool] = Field(None, description="Commission confirmation status")


class TransactionRead(TransactionBase, TimestampMixin):
    """Transaction read schema"""
    id: int
    type: str
    status: str
    commission_amount: Decimal
    total_amount: Decimal
    payment_status: str
    buyer_paid_amount: Decimal
    farmer_paid_amount: Decimal
    commission_confirmed: bool
    completion_status: str
    date: DateType
    
    class Config:
        from_attributes = True


class TransactionReadWithRelations(TransactionRead):
    """Transaction read schema with relationships"""
    transaction_items: List[TransactionItemRead] = []
    shop_name: Optional[str] = None
    buyer_name: Optional[str] = None
    payments: List["PaymentRead"] = []
    farmer_payments: List["FarmerPaymentRead"] = []


class TransactionSummary(BaseModel):
    """Transaction summary schema"""
    id: int
    shop_id: int
    buyer_user_id: int
    total_amount: Decimal
    commission_amount: Decimal
    completion_status: str
    financial_summary: dict
    item_count: int
    payment_count: int
    farmer_payment_count: int
    date: DateType
    created_at: datetime


class TransactionCompletionStatus(BaseModel):
    """Transaction completion status schema (three-party model)"""
    transaction_id: int
    buyer_payment_complete: bool
    farmer_payment_complete: bool
    commission_confirmed: bool
    overall_status: str  # 'pending', 'partial', 'complete'
    completion_percentage: float
    next_actions: List[str]
    amounts: dict


class TransactionAnalytics(BaseModel):
    """Transaction analytics schema"""
    shop_id: Optional[int] = None
    total_transactions: int
    total_amount: Decimal
    total_commission: Decimal
    completed_transactions: int
    pending_transactions: int
    average_transaction_value: Decimal
    period_start: DateType
    period_end: DateType


class TransactionFilter(BaseModel):
    """Transaction filter schema"""
    shop_id: Optional[int] = None
    buyer_user_id: Optional[int] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    completion_status: Optional[str] = None
    date_from: Optional[DateType] = None
    date_to: Optional[DateType] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None