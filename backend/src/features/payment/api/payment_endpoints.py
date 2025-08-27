from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ....database import get_db
from ..services.payment_service import PaymentService
from ..schemas.payment_schemas import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    FarmerPaymentCreate,
    FarmerPaymentUpdate,
    FarmerPaymentResponse,
    FarmerPaymentListResponse,
    PaymentMethodResponse,
    PaymentAnalyticsResponse,
    PaymentSearchRequest
)

# Create router
router = APIRouter(prefix="/payments", tags=["Payment Management"])

# Payment CRUD Endpoints
@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payment",
    description="Create a new buyer payment for a transaction with full validation and audit logging"
)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)  # TODO: Add auth dependency
):
    """
    Create a new payment record with business validation:
    - Validates transaction exists and is active
    - Checks payment amount against transaction total
    - Updates transaction payment status
    - Logs audit trail
    """
    service = PaymentService(db)
    return service.create_payment(payment_data)


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment by ID",
    description="Retrieve a specific payment with all related information"
)
def get_payment(
    payment_id: int = Path(..., gt=0, description="Payment ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get payment details including related transaction and method information"""
    service = PaymentService(db)
    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )
    return payment


@router.get(
    "/",
    response_model=PaymentListResponse,
    summary="List payments with filters",
    description="Get paginated list of payments with optional filtering"
)
def list_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    transaction_id: Optional[int] = Query(None, description="Filter by transaction ID"),
    payment_method_id: Optional[int] = Query(None, description="Filter by payment method"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[str] = Query(None, description="Filter payments from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter payments to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get paginated list of payments with optional filters"""
    filters = {
        "transaction_id": transaction_id,
        "payment_method_id": payment_method_id,
        "status": status,
        "date_from": date_from,
        "date_to": date_to
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}
    
    service = PaymentService(db)
    return service.get_payments(skip=skip, limit=limit, filters=filters)


@router.put(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Update payment",
    description="Update payment details with validation"
)
def update_payment(
    payment_id: int = Path(..., gt=0, description="Payment ID"),
    payment_data: PaymentUpdate = ...,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Update payment with business validation and audit logging"""
    service = PaymentService(db)
    payment = service.update_payment(payment_id, payment_data)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )
    return payment


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete payment",
    description="Soft delete a payment record"
)
def delete_payment(
    payment_id: int = Path(..., gt=0, description="Payment ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Soft delete payment by setting status to DELETED"""
    service = PaymentService(db)
    success = service.delete_payment(payment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )


# Farmer Payment Endpoints
@router.post(
    "/farmer-payments/",
    response_model=FarmerPaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create farmer payment",
    description="Create a payment to a farmer for their products"
)
def create_farmer_payment(
    farmer_payment_data: FarmerPaymentCreate,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """
    Create farmer payment with validation:
    - Validates farmer user exists
    - Checks against transaction and stock
    - Updates transaction farmer payment amount
    - Requires approval workflow
    """
    service = PaymentService(db)
    return service.create_farmer_payment(farmer_payment_data)


@router.get(
    "/farmer-payments/{farmer_payment_id}",
    response_model=FarmerPaymentResponse,
    summary="Get farmer payment by ID",
    description="Retrieve specific farmer payment details"
)
def get_farmer_payment(
    farmer_payment_id: int = Path(..., gt=0, description="Farmer payment ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get farmer payment details including farmer and transaction info"""
    service = PaymentService(db)
    farmer_payment = service.get_farmer_payment_by_id(farmer_payment_id)
    if not farmer_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer payment with ID {farmer_payment_id} not found"
        )
    return farmer_payment


@router.get(
    "/farmer-payments/",
    response_model=FarmerPaymentListResponse,
    summary="List farmer payments",
    description="Get paginated list of farmer payments with filters"
)
def list_farmer_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    farmer_id: Optional[int] = Query(None, description="Filter by farmer user ID"),
    transaction_id: Optional[int] = Query(None, description="Filter by transaction ID"),
    payment_type: Optional[str] = Query(None, description="Filter by payment type"),
    approved_only: bool = Query(False, description="Show only approved payments"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get paginated list of farmer payments with filters"""
    filters = {
        "farmer_id": farmer_id,
        "transaction_id": transaction_id,
        "payment_type": payment_type,
        "approved_only": approved_only
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    
    service = PaymentService(db)
    return service.get_farmer_payments(skip=skip, limit=limit, filters=filters)


@router.put(
    "/farmer-payments/{farmer_payment_id}/approve",
    response_model=FarmerPaymentResponse,
    summary="Approve farmer payment",
    description="Approve a farmer payment for processing"
)
def approve_farmer_payment(
    farmer_payment_id: int = Path(..., gt=0, description="Farmer payment ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Approve farmer payment and update transaction completion status"""
    service = PaymentService(db)
    farmer_payment = service.approve_farmer_payment(farmer_payment_id)
    if not farmer_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer payment with ID {farmer_payment_id} not found"
        )
    return farmer_payment


# Payment Method Endpoints
@router.get(
    "/methods/",
    response_model=List[PaymentMethodResponse],
    summary="Get payment methods",
    description="Get list of available payment methods"
)
def get_payment_methods(
    active_only: bool = Query(True, description="Show only active payment methods"),
    db: Session = Depends(get_db)
):
    """Get list of available payment methods for transactions"""
    service = PaymentService(db)
    return service.get_payment_methods(active_only=active_only)


# Analytics and Reporting Endpoints
@router.get(
    "/analytics/transaction/{transaction_id}",
    response_model=PaymentAnalyticsResponse,
    summary="Get payment analytics for transaction",
    description="Get detailed payment analytics for a specific transaction"
)
def get_transaction_payment_analytics(
    transaction_id: int = Path(..., gt=0, description="Transaction ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get comprehensive payment analytics for a transaction"""
    service = PaymentService(db)
    analytics = service.get_transaction_payment_analytics(transaction_id)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found"
        )
    return analytics


@router.get(
    "/analytics/summary",
    response_model=PaymentAnalyticsResponse,
    summary="Get payment summary analytics",
    description="Get payment analytics summary for a date range"
)
def get_payment_analytics_summary(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Get payment analytics summary for specified period"""
    service = PaymentService(db)
    return service.get_payment_analytics_summary(
        date_from=date_from,
        date_to=date_to,
        shop_id=shop_id
    )


# Search and Advanced Queries
@router.post(
    "/search",
    response_model=PaymentListResponse,
    summary="Advanced payment search",
    description="Advanced search for payments with multiple criteria"
)
def search_payments(
    search_request: PaymentSearchRequest,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Advanced search for payments with complex filters"""
    service = PaymentService(db)
    return service.search_payments(search_request)


# Batch Operations
@router.post(
    "/farmer-payments/batch-approve",
    response_model=dict,
    summary="Batch approve farmer payments",
    description="Approve multiple farmer payments in batch"
)
def batch_approve_farmer_payments(
    farmer_payment_ids: List[int],
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Batch approve multiple farmer payments"""
    service = PaymentService(db)
    result = service.batch_approve_farmer_payments(farmer_payment_ids)
    return {
        "approved_count": result["approved"],
        "failed_count": result["failed"],
        "errors": result["errors"]
    }


# Payment Status Updates
@router.put(
    "/{payment_id}/status",
    response_model=PaymentResponse,
    summary="Update payment status",
    description="Update payment status (e.g., mark as verified, failed, etc.)"
)
def update_payment_status(
    payment_id: int = Path(..., gt=0, description="Payment ID"),
    status: str = Query(..., description="New payment status"),
    notes: Optional[str] = Query(None, description="Status update notes"),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)
):
    """Update payment status with notes"""
    service = PaymentService(db)
    payment = service.update_payment_status(payment_id, status, notes)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )
    return payment