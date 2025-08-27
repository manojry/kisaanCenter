from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional, List
from ....database import get_db
from ....schemas import (
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
    response_description="Transaction creation result"
)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new transaction:
    
    - **shop_id**: Shop where transaction occurs
    - **buyer_user_id**: Buyer initiating the transaction
    - **transaction_type**: Type of transaction (sale, purchase, etc.)
    - **commission_rate**: Commission rate for the transaction
    - **transaction_items**: List of items in the transaction
    """
    result = TransactionService.create_transaction(db, transaction)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/{transaction_id}", response_model=APIResponse)
def get_transaction(
    transaction_id: int = Path(..., description="Transaction ID"),
    include_relations: bool = Query(False, description="Include related data"),
    db: Session = Depends(get_db)
):
    """Get transaction by ID with optional relations"""
    result = TransactionService.get_transaction(db, transaction_id, include_relations)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/", response_model=APIResponse)
def get_transactions(
    pagination: PaginationParams = Depends(),
    shop_id: Optional[int] = Query(None, description="Filter by shop"),
    buyer_user_id: Optional[int] = Query(None, description="Filter by buyer"),
    transaction_type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get all transactions with optional filtering"""
    filters = {}
    if shop_id:
        filters['shop_id'] = shop_id
    if buyer_user_id:
        filters['buyer_user_id'] = buyer_user_id
    if transaction_type:
        filters['transaction_type'] = transaction_type
    if status:
        filters['status'] = status
    
    result = TransactionService.get_transactions(db, pagination, filters)
    return result


@router.put("/{transaction_id}", response_model=APIResponse)
def update_transaction(
    transaction_id: int = Path(..., description="Transaction ID"),
    transaction_update: TransactionUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update transaction"""
    result = TransactionService.update_transaction(db, transaction_id, transaction_update)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.delete("/{transaction_id}", response_model=APIResponse)
def delete_transaction(
    transaction_id: int = Path(..., description="Transaction ID"),
    db: Session = Depends(get_db)
):
    """Delete transaction (soft delete)"""
    result = TransactionService.delete_transaction(db, transaction_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.post("/{transaction_id}/complete", response_model=APIResponse)
def complete_transaction(
    transaction_id: int = Path(..., description="Transaction ID"),
    db: Session = Depends(get_db)
):
    """Mark transaction as completed"""
    result = TransactionService.complete_transaction(db, transaction_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/{transaction_id}/completion-status", response_model=APIResponse)
def get_completion_status(
    transaction_id: int = Path(..., description="Transaction ID"),
    db: Session = Depends(get_db)
):
    """Get transaction completion status (3-checkbox model)"""
    result = TransactionService.get_completion_status(db, transaction_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.put("/{transaction_id}/commission-confirm", response_model=APIResponse)
def confirm_commission(
    transaction_id: int = Path(..., description="Transaction ID"),
    confirmed: bool = Query(..., description="Commission confirmed status"),
    db: Session = Depends(get_db)
):
    """Confirm commission for transaction (admin action)"""
    result = TransactionService.confirm_commission(db, transaction_id, confirmed)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/{transaction_id}/items", response_model=APIResponse)
def get_transaction_items(
    transaction_id: int = Path(..., description="Transaction ID"),
    db: Session = Depends(get_db)
):
    """Get all items for a transaction"""
    result = TransactionService.get_transaction_items(db, transaction_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result


@router.get("/{transaction_id}/summary", response_model=APIResponse)
def get_transaction_summary(
    transaction_id: int = Path(..., description="Transaction ID"),
    db: Session = Depends(get_db)
):
    """Get comprehensive transaction summary"""
    result = TransactionService.get_transaction_summary(db, transaction_id)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.message)
    return result