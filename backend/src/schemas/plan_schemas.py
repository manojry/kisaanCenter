from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from . import BaseSchema, TimestampMixin


class PlanBase(BaseSchema):
    """Base plan schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    monthly_price: Decimal = Field(..., gt=0, description="Monthly subscription price")
    quarterly_price: Optional[Decimal] = Field(None, gt=0, description="Quarterly price (with discount)")
    yearly_price: Optional[Decimal] = Field(None, gt=0, description="Yearly price (with discount)")
    max_farmers: int = Field(default=10, ge=1, description="Maximum farmers allowed")
    max_buyers: int = Field(default=20, ge=1, description="Maximum buyers allowed")
    max_transactions: int = Field(default=1000, ge=1, description="Maximum transactions per month")
    data_retention_months: int = Field(default=6, ge=1, description="Data retention in months")
    features: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Plan features")


class PlanCreate(PlanBase):
    """Plan creation schema"""
    pass


class PlanUpdate(BaseModel):
    """Plan update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    monthly_price: Optional[Decimal] = Field(None, gt=0, description="Monthly subscription price")
    quarterly_price: Optional[Decimal] = Field(None, gt=0, description="Quarterly price")
    yearly_price: Optional[Decimal] = Field(None, gt=0, description="Yearly price")
    max_farmers: Optional[int] = Field(None, ge=1, description="Maximum farmers allowed")
    max_buyers: Optional[int] = Field(None, ge=1, description="Maximum buyers allowed")
    max_transactions: Optional[int] = Field(None, ge=1, description="Maximum transactions per month")
    data_retention_months: Optional[int] = Field(None, ge=1, description="Data retention in months")
    features: Optional[Dict[str, Any]] = Field(None, description="Plan features")


class PlanRead(PlanBase, TimestampMixin):
    """Plan read schema"""
    id: int
    status: str
    
    class Config:
        from_attributes = True


class PlanReadWithRelations(PlanRead):
    """Plan read schema with relationships"""
    shops: List[Dict[str, Any]] = []
    subscriptions: List[Dict[str, Any]] = []


class PlanAnalytics(BaseModel):
    """Plan analytics schema"""
    plan_id: int
    plan_name: str
    total_shops: int
    total_active_subscriptions: int
    monthly_revenue: Decimal
    analytics_date: str
    
    class Config:
        from_attributes = True


class PlanFeatureBase(BaseSchema):
    """Base plan feature schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Feature name")
    description: Optional[str] = Field(None, description="Feature description")


class PlanFeatureCreate(PlanFeatureBase):
    """Plan feature creation schema"""
    plan_id: int = Field(..., description="Plan ID")


class PlanFeatureRead(PlanFeatureBase, TimestampMixin):
    """Plan feature read schema"""
    id: int
    plan_id: int
    
    class Config:
        from_attributes = True