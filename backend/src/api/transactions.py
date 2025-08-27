from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas import (
    TransactionCreate, TransactionUpdate, TransactionRead, TransactionReadWithRelations,
    APIResponse, PaginationParams, TransactionSummary
)
from ..services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new transaction",
    description="Create a new transaction with items and business validation",
    response_description="Transaction creation result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "shop_id": 1,
                        "buyer_user_id": 456,
                        "transaction_type": "sale",
                        "commission_rate": 10.00,
                        "transaction_items": [
                            {
                                "product_id": 789,
                                "farmer_stock_id": 101,
                                "quantity": 50.0,
                                "price": 100.00
                            }
                        ]
                    }
                }
            }
        },
        "responses": {
            "201": {
                "description": "Transaction created successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transaction created successfully",
                            "data": {
                                "id": 555,
                                "shop_id": 1,
                                "buyer_user_id": 456,
                                "transaction_type": "sale",
                                "commission_rate": 10.00,
                                "transaction_items": [
                                    {
                                        "product_id": 789,
                                        "farmer_stock_id": 101,
                                        "quantity": 50.0,
                                        "price": 100.00
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    created_by_id: Optional[int] = Query(None, description="ID of user creating the transaction")
):
    """
    Create a comprehensive transaction with:
    
    - **Transaction items**: Multiple products with quantities and prices
    - **Commission calculation**: Automatic commission calculation based on rules
    - **Three-party model**: Independent tracking of buyer/farmer payments and commission
    - **Stock validation**: Ensures sufficient stock available
    - **Business rules**: Validates buyer credit limits and shop ownership
    """
    # Example: Get user role from context/session (stub)
    # In production, use authentication middleware to get user info
    user_role = "owner"  # TODO: Replace with actual role from auth/session
    result = TransactionService.create_transaction(db, transaction, created_by_id, user_role=user_role)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": result.message
            }
        )
    return result

@router.get(
    "/{transaction_id}",
    response_model=APIResponse,
    summary="Get transaction by ID",
    description="Retrieve detailed transaction information",
    response_description="Transaction details",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Transaction found",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transaction found",
                            "data": {
                                "id": 555,
                                "shop_id": 1,
                                "buyer_user_id": 456,
                                "transaction_type": "sale",
                                "commission_rate": 10.00,
                                "transaction_items": [
                                    {
                                        "product_id": 789,
                                        "farmer_stock_id": 101,
                                        "quantity": 50.0,
                                        "price": 100.00
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_transaction(
    transaction_id: int = Path(..., description="Transaction ID", gt=0),
    include_relations: bool = Query(False, description="Include buyer, items, payments, credits"),
    db: Session = Depends(get_db)
):
    """
    Get detailed transaction information including:
    
    - **Basic info**: Transaction details and status
    - **Completion tracking**: Three-party completion status
    - **Financial summary**: Amounts, commission, outstanding balances
    - **Related data**: Buyer info, transaction items, payments, credits (optional)
    """
    result = TransactionService.get_transaction(db, transaction_id, include_relations)
    
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    
    return result

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get transactions with filtering and pagination",
    description="Retrieve paginated transactions with comprehensive filtering",
    response_description="Paginated transaction list",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Transactions retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transactions retrieved",
                            "data": [
                                {
                                    "id": 555,
                                    "shop_id": 1,
                                    "buyer_user_id": 456,
                                    "transaction_type": "sale",
                                    "commission_rate": 10.00,
                                    "transaction_items": [
                                        {
                                            "product_id": 789,
                                            "farmer_stock_id": 101,
                                            "quantity": 50.0,
                                            "price": 100.00
                                        }
                                    ]
                                }
                            ],
                            "pagination": {
                                "total": 20,
                                "page": 1,
                                "limit": 10,
                                "total_pages": 2
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    shop_id: Optional[int] = Query(None, description="Filter by shop"),
    buyer_id: Optional[int] = Query(None, description="Filter by buyer"),
    status: Optional[str] = Query(None, description="Filter by status"),
    completion_status: Optional[str] = Query(None, description="Filter by completion status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get paginated transactions with advanced filtering:
    
    - **Financial filters**: By amounts, payment status, completion status
    - **Date range**: Filter by transaction date range
    - **Entity filters**: By shop, buyer, transaction type
    - **Status filters**: By various status fields
    - **Sorting**: Configurable by any field
    """
    pagination = PaginationParams(page=page, limit=limit)
    
    result = TransactionService.get_transactions(
        db=db,
        pagination=pagination,
        shop_id=shop_id,
        buyer_id=buyer_id,
        status=status,
        completion_status=completion_status,
        payment_status=payment_status,
        transaction_type=transaction_type,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.put(
    "/{transaction_id}",
    response_model=APIResponse,
    summary="Update transaction",
    description="Update transaction details with business validation",
    response_description="Transaction update result",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "commission_rate": 12.0,
                        "status": "completed"
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Transaction updated successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transaction updated successfully",
                            "data": {
                                "id": 555,
                                "commission_rate": 12.0,
                                "status": "completed"
                            }
                        }
                    }
                }
            }
        }
    }
)
def update_transaction(
    transaction_id: int = Path(..., description="Transaction ID", gt=0),
    transaction_update: TransactionUpdate = ...,
    updated_by_id: Optional[int] = Query(None, description="ID of user making the update"),
    db: Session = Depends(get_db)
):
    """
    Update transaction with validation:
    
    - **Commission rate**: Update commission percentage
    - **Commission confirmation**: Mark commission as confirmed by owner
    - **Status updates**: Change transaction status
    - **Business rules**: Validates update permissions and constraints
    """
    # Example: Get user role from context/session (stub)
    # In production, use authentication middleware to get user info
    user_role = "owner"  # TODO: Replace with actual role from auth/session
    result = TransactionService.update_transaction(db, transaction_id, transaction_update, updated_by_id, user_role=user_role)

    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail={"message": result.message})
    return result

@router.delete(
    "/{transaction_id}",
    response_model=APIResponse,
    summary="Cancel transaction",
    description="Cancel transaction with business rule validation",
    response_description="Transaction cancellation result",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Transaction cancelled successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transaction cancelled successfully",
                            "data": null
                        }
                    }
                }
            }
        }
    }
)
def cancel_transaction(
    transaction_id: int = Path(..., description="Transaction ID", gt=0),
    reason: Optional[str] = Query(None, description="Cancellation reason"),
    db: Session = Depends(get_db)
):
    """
    Cancel transaction (soft delete):
    
    - **Business validation**: Ensures transaction can be cancelled
    - **Stock restoration**: Restores stock quantities if applicable
    - **Payment handling**: Manages existing payments and credits
    - **Audit trail**: Records cancellation reason and timestamp
    """
    # Example: Get user role from context/session (stub)
    # In production, use authentication middleware to get user info
    user_role = "owner"  # TODO: Replace with actual role from auth/session
    result = TransactionService.cancel_transaction(db, transaction_id, reason, user_role=user_role)

    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail={"message": result.message})
    return result

# Transaction completion and payment endpoints
@router.put(
    "/{transaction_id}/confirm-commission",
    response_model=APIResponse,
    summary="Confirm transaction commission",
    description="Mark commission as confirmed by owner",
    response_description="Commission confirmation result",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Commission confirmed successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Commission confirmed successfully",
                            "data": {
                                "id": 555,
                                "commission_confirmed": True
                            }
                        }
                    }
                }
            }
        }
    }
)
def confirm_commission(
    transaction_id: int = Path(..., description="Transaction ID", gt=0),
    confirmed_by_id: int = Query(..., description="ID of user confirming commission"),
    db: Session = Depends(get_db)
):
    """
    Confirm transaction commission:
    
    - **Owner verification**: Only owners can confirm commission
    - **Completion update**: Updates transaction completion status
    - **Audit logging**: Records commission confirmation
    """
    # Example: Get user role from context/session (stub)
    # In production, use authentication middleware to get user info
    user_role = "owner"  # TODO: Replace with actual role from auth/session
    result = TransactionService.confirm_commission(db, transaction_id, confirmed_by_id, user_role=user_role)

    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": result.message})
    return result

@router.get(
    "/{transaction_id}/summary",
    response_model=APIResponse,
    summary="Get transaction financial summary",
    description="Get detailed financial breakdown of transaction",
    response_description="Transaction financial summary",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Transaction summary retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Transaction summary retrieved",
                            "data": {
                                "id": 555,
                                "total_amount": 5000.00,
                                "commission": 500.00,
                                "buyer_paid": 4500.00,
                                "farmer_paid": 4000.00,
                                "outstanding": 500.00
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_transaction_summary(
    transaction_id: int = Path(..., description="Transaction ID", gt=0),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive transaction summary:
    
    - **Financial breakdown**: Total amounts, commission, net amounts
    - **Payment tracking**: Buyer payments, farmer payments
    - **Completion status**: Three-party completion progress
    - **Outstanding balances**: What payments are still pending
    """
    result = TransactionService.get_transaction_summary(db, transaction_id)
    
    if not result.success:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in result.message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=result.message)
    
    return result

# Business intelligence endpoints
@router.get(
    "/shop/{shop_id}/dashboard",
    response_model=APIResponse,
    summary="Get shop transaction dashboard",
    description="Get comprehensive transaction dashboard for shop",
    response_description="Shop transaction dashboard",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Shop dashboard retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Shop dashboard retrieved",
                            "data": {
                                "shop_id": 1,
                                "total_transactions": 100,
                                "completed": 80,
                                "pending": 20,
                                "revenue": 100000.00,
                                "commission": 10000.00
                            }
                        }
                    }
                }
            }
        }
    }
)
def get_shop_dashboard(
    shop_id: int = Path(..., description="Shop ID", gt=0),
    date_from: Optional[str] = Query(None, description="Dashboard date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Dashboard date to (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get shop transaction dashboard with:
    
    - **Transaction counts**: By status and completion
    - **Financial metrics**: Revenue, commission, outstanding amounts
    - **Completion tracking**: Three-party completion statistics
    - **Performance indicators**: Key business metrics
    """
    result = TransactionService.get_shop_dashboard(db, shop_id, date_from, date_to)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result

@router.get(
    "/completion-status/pending",
    response_model=APIResponse,
    summary="Get incomplete transactions",
    description="Get transactions requiring completion actions",
    response_description="Incomplete transactions list",
    openapi_extra={
        "responses": {
            "200": {
                "description": "Incomplete transactions retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "success": True,
                            "message": "Incomplete transactions retrieved",
                            "data": [
                                {
                                    "id": 556,
                                    "action_required": "buyer_payment",
                                    "outstanding": 500.00
                                },
                                {
                                    "id": 557,
                                    "action_required": "commission",
                                    "outstanding": 200.00
                                }
                            ],
                            "pagination": {
                                "total": 2,
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
def get_incomplete_transactions(
    shop_id: Optional[int] = Query(None, description="Filter by shop"),
    action_required: Optional[str] = Query(None, description="buyer_payment|farmer_payment|commission"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get transactions needing completion actions:
    
    - **Buyer payments**: Transactions with pending buyer payments
    - **Farmer payments**: Transactions with pending farmer payments  
    - **Commission**: Transactions with unconfirmed commissions
    - **Action priority**: Sorted by urgency and amount
    """
    pagination = PaginationParams(page=page, limit=limit)
    result = TransactionService.get_incomplete_transactions(db, shop_id, action_required, pagination)
    
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    
    return result
