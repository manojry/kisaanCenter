"""
Payment Feature Module

This module handles all payment-related functionality including:
- Buyer payments for transactions
- Farmer payments and settlements
- Payment method management
- Payment analytics and reporting
- Payment status tracking and approval workflows

Key Components:
- API endpoints for payment operations
- Business logic services for payment processing
- Data models for payments, farmer payments, and payment methods
- CRUD operations for database interactions
- Pydantic schemas for request/response validation

Features:
- Comprehensive payment management
- Multiple payment types support
- Farmer payment approval workflow
- Payment method configuration
- Transaction payment tracking
- Payment analytics and reporting
- Advanced search and filtering
- Batch operations support
- Real-time payment status updates
"""

from .api.payment_endpoints import router as payment_router
from .services.payment_service import PaymentService
from ...models.payment import Payment, FarmerPayment, PaymentMethod
from .crud.payment_crud import PaymentCRUD, FarmerPaymentCRUD, PaymentMethodCRUD
from .schemas.payment_schemas import (
    # Payment schemas
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    
    # Farmer payment schemas
    FarmerPaymentCreate,
    FarmerPaymentUpdate,
    FarmerPaymentResponse,
    FarmerPaymentListResponse,
    
    # Payment method schemas
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentMethodResponse,
    
    # Analytics schemas
    PaymentAnalyticsResponse,
    
    # Search schemas
    PaymentSearchRequest,
    FarmerPaymentSearchRequest,
    
    # Bulk operation schemas
    PaymentBulkUpdateRequest,
    FarmerPaymentApprovalRequest,
    PaymentStatusUpdateRequest,
    
    # Enum schemas
    PaymentTypeEnum,
    FarmerPaymentTypeEnum
)

__all__ = [
    # Router
    "payment_router",
    
    # Services
    "PaymentService",
    
    # Models
    "Payment",
    "FarmerPayment", 
    "PaymentMethod",
    
    # CRUD
    "PaymentCRUD",
    "FarmerPaymentCRUD",
    "PaymentMethodCRUD",
    
    # Payment Schemas
    "PaymentCreate",
    "PaymentUpdate",
    "PaymentResponse",
    "PaymentListResponse",
    
    # Farmer Payment Schemas
    "FarmerPaymentCreate",
    "FarmerPaymentUpdate",
    "FarmerPaymentResponse",
    "FarmerPaymentListResponse",
    
    # Payment Method Schemas
    "PaymentMethodCreate",
    "PaymentMethodUpdate",
    "PaymentMethodResponse",
    
    # Analytics Schemas
    "PaymentAnalyticsResponse",
    
    # Search Schemas
    "PaymentSearchRequest",
    "FarmerPaymentSearchRequest",
    
    # Bulk Operation Schemas
    "PaymentBulkUpdateRequest",
    "FarmerPaymentApprovalRequest",
    "PaymentStatusUpdateRequest",
    
    # Enums
    "PaymentTypeEnum",
    "FarmerPaymentTypeEnum"
]

# Version info
__version__ = "1.0.0"
__author__ = "KisaanCenter Development Team"
__email__ = "dev@kisaancenter.com"

# Module metadata
FEATURE_NAME = "payment"
FEATURE_DESCRIPTION = "Comprehensive payment management system"
SUPPORTED_OPERATIONS = [
    "payment_create",
    "payment_update", 
    "payment_delete",
    "payment_search",
    "farmer_payment_create",
    "farmer_payment_approve",
    "farmer_payment_bulk_approve",
    "payment_method_management",
    "payment_analytics",
    "transaction_payment_tracking"
]

# Business rules summary
BUSINESS_RULES = {
    "payment_validation": {
        "amount_must_be_positive": True,
        "transaction_must_exist": True,
        "payment_method_must_be_active": True,
        "cannot_exceed_transaction_total": True
    },
    "farmer_payment_validation": {
        "farmer_must_exist": True,
        "farmer_must_be_active": True,
        "requires_approval": True,
        "cannot_exceed_farmer_due": True
    },
    "completion_tracking": {
        "updates_transaction_status": True,
        "recalculates_completion_percentage": True,
        "tracks_next_actions": True
    }
}