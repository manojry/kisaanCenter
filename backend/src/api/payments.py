from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import PaymentCreate, PaymentUpdate, APIResponse, PaginationParams
from ..services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payment",
    description="Create a new payment record",
    response_description="Payment creation result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "transaction_id": 555,
                        "amount": 5000.00,
                        "method": "bank_transfer",
                        "paid_by": 123,
                        "paid_to": 456
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Payment created successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Payment created successfully",
                            "data": {
                                "id": 1001,
                                "transaction_id": 555,
                                "amount": 5000.00,
                                "method": "bank_transfer",
                                "paid_by": 123,
                                "paid_to": 456
                            }
                        }
                    }
                }
            }
        }
    }
)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
        # TODO: Extract user_role from auth/session (stub: use SUPERADMIN)
        user_role = "superadmin"  # Replace with actual role extraction
        result = PaymentService.create_payment(db, payment, user_role=user_role)
        if not result.success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
        return result

@router.get(
    "/{payment_id}",
    response_model=APIResponse,
    summary="Get payment by ID",
    description="Retrieve a specific payment record",
    response_description="Payment details",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Payment found",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Payment found",
                            "data": {
                                "id": 1001,
                                "transaction_id": 555,
                                "amount": 5000.00,
                                "method": "bank_transfer",
                                "paid_by": 123,
                                "paid_to": 456
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_payment(payment_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
        user_role = "superadmin"  # Replace with actual role extraction
        result = PaymentService.get_payment(db, payment_id, user_role=user_role)
        if not result.success:
            status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
            raise HTTPException(status_code=status_code, detail=result.message)
        return result

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get payments with pagination",
    description="Retrieve a paginated list of payments",
    response_description="Paginated payment list",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Payments retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Payments retrieved",
                            "data": [
                                {
                                    "id": 1001,
                                    "transaction_id": 555,
                                    "amount": 5000.00,
                                    "method": "bank_transfer",
                                    "paid_by": 123,
                                    "paid_to": 456
                                }
                            ],
                            "pagination": {
                                "total": 10,
                                "page": 1,
                                "limit": 10,
                                "total_pages": 1
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pagination = PaginationParams(page=page, limit=limit)
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.get_payments(db, pagination, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result

@router.put(
    "/{payment_id}",
    response_model=APIResponse,
    summary="Update payment",
    description="Update payment details",
    response_description="Payment update result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "amount": 5500.00,
                        "method": "cash"
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Payment updated successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Payment updated successfully",
                            "data": {
                                "id": 1001,
                                "amount": 5500.00,
                                "method": "cash"
                            }
                        }
                    }
                }
            }
        }
    }
)
def update_payment(
    payment_id: int = Path(..., gt=0),
    payment_update: PaymentUpdate = ...,
    db: Session = Depends(get_db)
):
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.update_payment(db, payment_id, payment_update, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.delete(
    "/{payment_id}",
    response_model=APIResponse,
    summary="Delete payment",
    description="Delete payment record",
    response_description="Payment deletion result",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Payment deleted successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Payment deleted successfully",
                            "data": None
                        }
                    }
                }
            }
        }
    }
)
def delete_payment(payment_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.delete_payment(db, payment_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

# Business-specific
@router.get(
    "/transaction/{transaction_id}",
    response_model=APIResponse,
    summary="Get payments by transaction ID",
    description="Retrieve payments associated with a specific transaction",
    response_description="Transaction payments",
)
def get_payments_by_transaction(transaction_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.get_payments_by_transaction(db, transaction_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.get(
    "/user/{user_id}",
    response_model=APIResponse,
    summary="Get payments by user ID",
    description="Retrieve payments made or received by a specific user",
    response_description="User payments",
)
def get_payments_by_user(user_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.get_payments_by_user(db, user_id, user_role=user_role)
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    return result

@router.post(
    "/bulk",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create multiple payments",
    description="Create multiple payment records in bulk",
    response_description="Bulk payment creation result",
)
def create_bulk_payments(payments: list[PaymentCreate], db: Session = Depends(get_db)):
    user_role = "superadmin"  # Replace with actual role extraction
    result = PaymentService.create_bulk_payments(db, payments, user_role=user_role)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result
