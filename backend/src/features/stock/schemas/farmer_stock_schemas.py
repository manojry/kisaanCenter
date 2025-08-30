
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel, Field, validator, root_validator

from src.core.enums import FarmerStockMode, RecordStatus, AuditAction

class FarmerStockBase(BaseModel):
    farmer_user_id: int
    product_id: int
    shop_id: int
    declared_qty: Optional[Decimal] = Field(None, gt=0, description="Declared stock quantity")
    unit_price: Optional[Decimal] = Field(None, gt=0, description="Unit price for stock")
    entry_date: date = Field(default_factory=date.today)
    notes: Optional[str] = Field(None, max_length=500)

class FarmerStockCreate(FarmerStockBase):
    mode: FarmerStockMode = FarmerStockMode.IMPLICIT
    declared_by_id: Optional[int] = None
    
    @root_validator
    def validate_declared_mode(cls, values):
        mode = values.get('mode')
        declared_qty = values.get('declared_qty')
        declared_by_id = values.get('declared_by_id')
        
        if mode == FarmerStockMode.DECLARED:
            if declared_qty is None:
                raise ValueError("declared_qty is required for DECLARED mode")
            if declared_by_id is None:
                raise ValueError("declared_by_id is required for DECLARED mode")
        
        return values

class FarmerStockUpdate(BaseModel):
    declared_qty: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=500)
    status: Optional[RecordStatus] = None

class FarmerStockLateDeclaration(BaseModel):
    declared_qty: Decimal = Field(..., gt=0)
    declared_by_id: int
    notes: Optional[str] = Field(None, max_length=500)

class FarmerStockRead(FarmerStockBase):
    id: int
    mode: FarmerStockMode
    sold_qty: Decimal
    balance_qty: Optional[Decimal]
    total_value: Optional[Decimal]
    sold_value: Optional[Decimal]
    is_oversold: bool
    completion_percentage: Optional[float]
    declared_at: Optional[datetime]
    declared_by_id: Optional[int]
    carry_forward: bool
    carried_from_date: Optional[date]
    status: RecordStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FarmerStockReadWithRelations(FarmerStockRead):
    farmer_user: Optional[Dict[str, Any]] = None
    product: Optional[Dict[str, Any]] = None
    shop: Optional[Dict[str, Any]] = None
    declared_by: Optional[Dict[str, Any]] = None
    audit_logs: List["FarmerStockAuditRead"] = []

class FarmerStockAuditRead(BaseModel):
    id: int
    farmer_stock_id: int
    performed_by_id: int
    action_type: str
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    transaction_id: Optional[int]
    notes: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

class FarmerStockSummary(BaseModel):
    """Summary for dashboard display"""
    farmer_id: int
    farmer_name: str
    entry_date: date
    total_products: int
    declared_products: int
    implicit_products: int
    total_declared_value: Optional[Decimal]
    total_sold_value: Decimal
    completion_rate: Optional[float]
    oversold_products: int

class ShopStockOverview(BaseModel):
    """Shop-wide stock overview"""
    shop_id: int
    entry_date: date
    total_farmers: int
    farmers_with_declarations: int
    total_stock_records: int
    declared_stock_records: int
    implicit_stock_records: int
    total_declared_value: Optional[Decimal]
    total_sold_value: Decimal
    declaration_rate: float
    oversold_records: int
