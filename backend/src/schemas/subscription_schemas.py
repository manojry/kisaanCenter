"""
Subscription Management Schemas

Pydantic models for subscription-related request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

class BillingCycleEnum(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionStatusEnum(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class PaymentStatusEnum(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    FAILED = "failed"
    OVERDUE = "overdue"

class LimitTypeEnum(str, Enum):
    COUNT = "count"
    DAYS = "days"
    MONTHS = "months"
    PERCENTAGE = "percentage"

# Plan Schemas

class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    monthly_price: Decimal = Field(..., gt=0)
    max_farmers: int = Field(default=10, ge=1)
    max_buyers: int = Field(default=20, ge=1)
    max_transactions: int = Field(default=1000, ge=1)
    data_retention_months: int = Field(default=6, ge=1)
    features: Optional[Dict[str, Any]] = None

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    monthly_price: Optional[Decimal] = Field(None, gt=0)
    max_farmers: Optional[int] = Field(None, ge=1)
    max_buyers: Optional[int] = Field(None, ge=1)
    max_transactions: Optional[int] = Field(None, ge=1)
    data_retention_months: Optional[int] = Field(None, ge=1)
    features: Optional[Dict[str, Any]] = None

class PlanResponse(PlanBase):
    id: int
    quarterly_price: Optional[Decimal] = None
    yearly_price: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Subscription Schemas

class SubscriptionBase(BaseModel):
    shop_id: int
    plan_id: int
    billing_cycle: BillingCycleEnum = BillingCycleEnum.MONTHLY
    auto_renew: bool = True

class SubscriptionCreate(SubscriptionBase):
    start_date: Optional[date] = None

class SubscriptionUpdate(BaseModel):
    billing_cycle: Optional[BillingCycleEnum] = None
    auto_renew: Optional[bool] = None
    status: Optional[SubscriptionStatusEnum] = None
    payment_status: Optional[PaymentStatusEnum] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    start_date: date
    end_date: date
    status: SubscriptionStatusEnum
    payment_status: PaymentStatusEnum
    amount: Decimal
    discount_amount: Decimal
    created_at: datetime
    updated_at: datetime
    
    # Nested relationships
    plan: Optional[PlanResponse] = None
    
    class Config:
        from_attributes = True

# Feature Control Schemas

class FeatureControlBase(BaseModel):
    shop_id: int
    feature_name: str = Field(..., min_length=1, max_length=100)
    is_enabled: bool = True
    limit_value: Optional[int] = None
    limit_type: Optional[LimitTypeEnum] = None
    reason: Optional[str] = None

class FeatureControlCreate(FeatureControlBase):
    controlled_by: int
    effective_from: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class FeatureControlUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    limit_value: Optional[int] = None
    limit_type: Optional[LimitTypeEnum] = None
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None

class FeatureControlResponse(FeatureControlBase):
    id: int
    controlled_by: Optional[int] = None
    effective_from: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Usage Tracking Schemas

class UsageTrackingResponse(BaseModel):
    id: int
    shop_id: int
    feature_name: str
    usage_count: int
    usage_date: date
    reset_cycle: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UsageSummaryResponse(BaseModel):
    shop_id: int
    period_days: int
    usage_summary: Dict[str, Dict[str, Any]]

# Subscription History Schemas

class SubscriptionHistoryResponse(BaseModel):
    id: int
    subscription_id: int
    shop_id: int
    previous_plan_id: Optional[int] = None
    new_plan_id: int
    change_reason: Optional[str] = None
    changed_by: Optional[int] = None
    effective_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True

# Limit Check Response Schemas

class LimitCheckResponse(BaseModel):
    feature: str
    can_create: bool
    current_count: int
    limit: int
    remaining: int
    usage_percentage: float
    status: str  # NORMAL, NOTICE, WARNING_HIGH, WARNING_CRITICAL, BLOCKED
    reason: Optional[str] = None

class DataAccessResponse(BaseModel):
    feature: str = "data_retention"
    accessible_from: Optional[date] = None
    accessible_to: date
    retention_months: Optional[int] = None
    is_restricted: bool

class TransactionLimitResponse(LimitCheckResponse):
    reset_date: date

# Upgrade Prediction Schemas

class UpgradeRecommendation(BaseModel):
    upgrade_score: int = Field(..., ge=0, le=100)
    recommendation_level: str  # LOW, MEDIUM, HIGH
    recommendations: List[str]
    usage_summary: Dict[str, LimitCheckResponse]

# Analytics Schemas

class RevenueAnalytics(BaseModel):
    monthly_recurring_revenue: float
    annual_recurring_revenue: float
    active_subscriptions: int
    revenue_by_plan: Dict[str, float]
    total_customers: int

class SubscriptionAnalytics(BaseModel):
    subscription_status_distribution: List[Dict[str, Any]]
    billing_cycle_distribution: List[Dict[str, Any]]
    plan_popularity: List[Dict[str, Any]]

class UpcomingRenewal(BaseModel):
    subscription_id: int
    shop_id: int
    shop_name: str
    plan_name: str
    end_date: date
    amount: float
    billing_cycle: BillingCycleEnum

class UpcomingRenewalsResponse(BaseModel):
    upcoming_renewals_count: int
    days_ahead: int
    renewals: List[UpcomingRenewal]

# Request Schemas for API endpoints

class CreateSubscriptionRequest(BaseModel):
    shop_id: int = Field(..., gt=0)
    plan_id: int = Field(..., gt=0)
    billing_cycle: BillingCycleEnum = BillingCycleEnum.MONTHLY
    start_date: Optional[date] = None
    
    @validator('start_date')
    def validate_start_date(cls, v):
        if v and v < date.today():
            raise ValueError('Start date cannot be in the past')
        return v

class UpgradeSubscriptionRequest(BaseModel):
    new_plan_id: int = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=500)

class UpdateFeatureControlRequest(BaseModel):
    feature_name: str = Field(..., min_length=1, max_length=100)
    is_enabled: Optional[bool] = None
    limit_value: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = Field(None, max_length=500)

class TrackUsageRequest(BaseModel):
    feature_name: str = Field(..., min_length=1, max_length=100)
    count: int = Field(default=1, ge=1)

# Response wrapper schemas

class APIResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool

# Health check schema

class SubscriptionHealthCheck(BaseModel):
    status: str
    timestamp: str
    metrics: Dict[str, int]
