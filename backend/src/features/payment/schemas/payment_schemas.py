from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date as Date
from decimal import Decimal
from enum import Enum

# Import from models if needed
from ....models import RecordStatus, PaymentType, FarmerPaymentType


class PaymentTypeEnum(str, Enum):
    """Payment type enumeration"""
    FULL_PAYMENT = "FULL_PAYMENT"
    PARTIAL_PAYMENT = "PARTIAL_PAYMENT"
    ADVANCE_PAYMENT = "ADVANCE_PAYMENT"
    CREDIT_PAYMENT = "CREDIT_PAYMENT"


class FarmerPaymentTypeEnum(str, Enum):
    """Farmer payment type enumeration"""
    IMMEDIATE = "IMMEDIATE"
    SCHEDULED = "SCHEDULED"
    INSTALLMENT = "INSTALLMENT"
    BONUS = "BONUS"


# Payment Base Schemas
class PaymentBase(BaseModel):
    """Base payment schema"""
    transaction_id: int = Field(..., gt=0, description="Transaction ID")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Payment amount")
    payment_method_id: int = Field(..., gt=0, description="Payment method ID")
    type: PaymentTypeEnum = Field(..., description="Payment type")
    date: Date = Field(..., description="Payment date")
    reference_number: Optional[str] = Field(None, max_length=100, description="External reference number")
    notes: Optional[str] = Field(None, max_length=500, description="Payment notes")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Payment amount must be positive')
        return v
    
    @validator('reference_number')
    def validate_reference_number(cls, v):
        if v and not v.strip():
            raise ValueError('Reference number cannot be empty if provided')
        return v.strip() if v else None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment"""
    credit_id: Optional[int] = Field(None, gt=0, description="Credit ID if this is a credit payment")
    processed_by: Optional[int] = Field(None, gt=0, description="User ID who processed the payment")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": 1,
                "amount": 5000.50,
                "payment_method_id": 1,
                "type": "FULL_PAYMENT",
                "date": "2024-01-15",
                "reference_number": "REF123456",
                "notes": "Payment via bank transfer"
            }
        }


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    payment_method_id: Optional[int] = Field(None, gt=0)
    type: Optional[PaymentTypeEnum] = None
    date: Optional[Date] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    status: Optional[RecordStatus] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Payment amount must be positive')
        return v
    
    @validator('reference_number')
    def validate_reference_number(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Reference number cannot be empty if provided')
        return v.strip() if v else v


class PaymentInDB(PaymentBase):
    """Payment schema for database representation"""
    id: int
    credit_id: Optional[int] = None
    processed_by: Optional[int] = None
    status: RecordStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PaymentResponse(PaymentInDB):
    """Payment response schema with additional computed fields"""
    payment_method_name: Optional[str] = None
    processed_by_name: Optional[str] = None
    transaction_info: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "transaction_id": 1,
                "amount": 5000.50,
                "payment_method_id": 1,
                "type": "FULL_PAYMENT",
                "date": "2024-01-15",
                "reference_number": "REF123456",
                "notes": "Payment via bank transfer",
                "status": "ACTIVE",
                "created_at": "2024-01-15T10:30:00",
                "payment_method_name": "Bank Transfer",
                "processed_by_name": "John Doe",
                "transaction_info": {
                    "total_amount": 5000.50,
                    "completion_status": "complete"
                }
            }
        }


class PaymentListResponse(BaseModel):
    """Response schema for payment list"""
    payments: List[PaymentResponse]
    total: int
    page: int
    size: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "payments": [
                    {
                        "id": 1,
                        "transaction_id": 1,
                        "amount": 5000.50,
                        "payment_method_name": "Bank Transfer",
                        "date": "2024-01-15"
                    }
                ],
                "total": 50,
                "page": 1,
                "size": 10
            }
        }


# Farmer Payment Schemas
class FarmerPaymentBase(BaseModel):
    """Base farmer payment schema"""
    transaction_id: int = Field(..., gt=0, description="Transaction ID")
    farmer_user_id: int = Field(..., gt=0, description="Farmer user ID")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Payment amount")
    payment_type: FarmerPaymentTypeEnum = Field(..., description="Farmer payment type")
    payment_method_id: int = Field(..., gt=0, description="Payment method ID")
    date: Date = Field(..., description="Payment date")
    remarks: Optional[str] = Field(None, max_length=500, description="Payment remarks")
    reference_number: Optional[str] = Field(None, max_length=100, description="External reference number")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Payment amount must be positive')
        return v


class FarmerPaymentCreate(FarmerPaymentBase):
    """Schema for creating a farmer payment"""
    farmer_stock_id: Optional[int] = Field(None, gt=0, description="Farmer stock ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": 1,
                "farmer_user_id": 5,
                "amount": 4500.00,
                "payment_type": "IMMEDIATE",
                "payment_method_id": 1,
                "date": "2024-01-15",
                "remarks": "Payment for tomatoes delivery"
            }
        }


class FarmerPaymentUpdate(BaseModel):
    """Schema for updating a farmer payment"""
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    payment_type: Optional[FarmerPaymentTypeEnum] = None
    payment_method_id: Optional[int] = Field(None, gt=0)
    date: Optional[Date] = None
    remarks: Optional[str] = Field(None, max_length=500)
    reference_number: Optional[str] = Field(None, max_length=100)
    status: Optional[RecordStatus] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Payment amount must be positive')
        return v


class FarmerPaymentInDB(FarmerPaymentBase):
    """Farmer payment schema for database representation"""
    id: int
    farmer_stock_id: Optional[int] = None
    approved_by: Optional[int] = None
    status: RecordStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FarmerPaymentResponse(FarmerPaymentInDB):
    """Farmer payment response schema with additional computed fields"""
    farmer_name: Optional[str] = None
    payment_method_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    transaction_info: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "transaction_id": 1,
                "farmer_user_id": 5,
                "amount": 4500.00,
                "payment_type": "IMMEDIATE",
                "payment_method_id": 1,
                "date": "2024-01-15",
                "remarks": "Payment for tomatoes delivery",
                "status": "ACTIVE",
                "created_at": "2024-01-15T11:00:00",
                "farmer_name": "Ravi Kumar",
                "payment_method_name": "Cash",
                "approved_by_name": "Shop Owner"
            }
        }


class FarmerPaymentListResponse(BaseModel):
    """Response schema for farmer payment list"""
    farmer_payments: List[FarmerPaymentResponse]
    total: int
    page: int
    size: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "farmer_payments": [
                    {
                        "id": 1,
                        "farmer_user_id": 5,
                        "amount": 4500.00,
                        "farmer_name": "Ravi Kumar",
                        "date": "2024-01-15"
                    }
                ],
                "total": 25,
                "page": 1,
                "size": 10
            }
        }


# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    """Base payment method schema"""
    name: str = Field(..., min_length=1, max_length=50, description="Payment method name")
    description: Optional[str] = Field(None, max_length=255, description="Payment method description")
    is_active: bool = Field(True, description="Whether payment method is active")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Payment method name cannot be empty')
        return v.strip()


class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a payment method"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Bank Transfer",
                "description": "Electronic bank transfer",
                "is_active": True
            }
        }


class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Payment method name cannot be empty')
        return v.strip() if v else v


class PaymentMethodResponse(PaymentMethodBase):
    """Payment method response schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Bank Transfer",
                "description": "Electronic bank transfer",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00"
            }
        }


# Analytics and Reporting Schemas
class PaymentAnalyticsResponse(BaseModel):
    """Payment analytics response"""
    transaction_id: Optional[int] = None
    period: Optional[Dict[str, Any]] = None
    summary: Dict[str, Any]
    breakdown_by_method: Optional[Dict[str, Any]] = None
    breakdown_by_type: Optional[Dict[str, Any]] = None
    buyer_payments: Optional[Dict[str, Any]] = None
    farmer_payments: Optional[Dict[str, Any]] = None
    completion_status: Optional[str] = None
    next_actions: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": 1,
                "summary": {
                    "total_payments": 10,
                    "total_amount": 50000.00,
                    "average_payment": 5000.00
                },
                "buyer_payments": {
                    "count": 2,
                    "total_paid": 50000.00,
                    "remaining": 0.00,
                    "percentage_complete": 100.0
                },
                "completion_status": "complete",
                "next_actions": []
            }
        }


# Search and Filter Schemas
class PaymentSearchRequest(BaseModel):
    """Payment search request schema"""
    transaction_id: Optional[int] = Field(None, gt=0, description="Filter by transaction ID")
    amount_min: Optional[Decimal] = Field(None, ge=0, description="Minimum payment amount")
    amount_max: Optional[Decimal] = Field(None, ge=0, description="Maximum payment amount")
    payment_method_ids: Optional[List[int]] = Field(None, description="Filter by payment method IDs")
    date_from: Optional[Date] = Field(None, description="Filter payments from date")
    date_to: Optional[Date] = Field(None, description="Filter payments to date")
    payment_types: Optional[List[PaymentTypeEnum]] = Field(None, description="Filter by payment types")
    status: Optional[RecordStatus] = Field(None, description="Filter by status")
    skip: Optional[int] = Field(0, ge=0, description="Number of records to skip")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Number of records to return")
    
    @validator('amount_max')
    def validate_amount_range(cls, v, values):
        if v is not None and 'amount_min' in values and values['amount_min'] is not None:
            if v < values['amount_min']:
                raise ValueError('Maximum amount must be greater than minimum amount')
        return v
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        if v is not None and 'date_from' in values and values['date_from'] is not None:
            if v < values['date_from']:
                raise ValueError('End date must be after start date')
        return v


class FarmerPaymentSearchRequest(BaseModel):
    """Farmer payment search request schema"""
    farmer_id: Optional[int] = Field(None, gt=0, description="Filter by farmer ID")
    transaction_id: Optional[int] = Field(None, gt=0, description="Filter by transaction ID")
    payment_types: Optional[List[FarmerPaymentTypeEnum]] = Field(None, description="Filter by payment types")
    date_from: Optional[Date] = Field(None, description="Filter payments from date")
    date_to: Optional[Date] = Field(None, description="Filter payments to date")
    approved_only: Optional[bool] = Field(False, description="Show only approved payments")
    pending_only: Optional[bool] = Field(False, description="Show only pending payments")
    skip: Optional[int] = Field(0, ge=0, description="Number of records to skip")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Number of records to return")


# Bulk Operations Schemas
class PaymentBulkUpdateRequest(BaseModel):
    """Bulk update request for payments"""
    payment_ids: List[int] = Field(..., min_items=1, description="List of payment IDs to update")
    update_data: PaymentUpdate = Field(..., description="Update data to apply")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payment_ids": [1, 2, 3],
                "update_data": {
                    "status": "ACTIVE"
                }
            }
        }


class FarmerPaymentApprovalRequest(BaseModel):
    """Farmer payment approval request"""
    farmer_payment_ids: List[int] = Field(..., min_items=1, description="List of farmer payment IDs to approve")
    approved_by: Optional[int] = Field(None, gt=0, description="User ID who is approving")
    approval_notes: Optional[str] = Field(None, max_length=500, description="Approval notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "farmer_payment_ids": [1, 2, 3],
                "approved_by": 10,
                "approval_notes": "Payments verified and approved"
            }
        }


class PaymentStatusUpdateRequest(BaseModel):
    """Payment status update request"""
    status: RecordStatus = Field(..., description="New payment status")
    notes: Optional[str] = Field(None, max_length=500, description="Status update notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "ACTIVE",
                "notes": "Payment verified and processed"
            }
        }