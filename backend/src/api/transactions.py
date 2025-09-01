from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from ..database import get_db
from ..schemas.transaction_schemas import (
    TransactionCreate, TransactionUpdate, TransactionRead, 
    TransactionReadWithRelations, PaymentUpdateRequest, 
    BulkUpdateRequest, TransactionSummary, TransactionAnalytics
)
from ..schemas import APIResponse, PaginationParams
from ..services.transaction_service import TransactionService
from ..core.auth import get_current_user_id, get_current_user_role
from ..models.enums import TransactionStatus, PaymentStatus, CompletionStatus, PaymentMethod, UserRole

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role)
):
    """Create a new transaction with items"""
    return TransactionService.create_transaction(
        db=db, 
        transaction_data=transaction,
        created_by_id=current_user_id,
        user_role=current_user_role
    )

@router.get("/{transaction_id}", response_model=APIResponse)
def get_transaction(
    transaction_id: int = Path(..., gt=0),
    include_relations: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get a single transaction by ID"""
    return TransactionService.get_transaction(
        db=db, 
        transaction_id=transaction_id,
        include_relations=include_relations
    )

@router.get("/", response_model=APIResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    shop_id: Optional[int] = Query(None, gt=0),
    buyer_id: Optional[int] = Query(None, gt=0),
    transaction_status: Optional[TransactionStatus] = Query(None),
    completion_status: Optional[CompletionStatus] = Query(None),
    payment_status: Optional[PaymentStatus] = Query(None),
    transaction_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    """Get transactions with pagination and filters"""
    pagination = PaginationParams(page=page, limit=limit)
    
    filters = {
        "shop_id": shop_id,
        "buyer_id": buyer_id,
        "status": transaction_status.value if transaction_status else None,
        "completion_status": completion_status.value if completion_status else None,
        "payment_status": payment_status.value if payment_status else None,
        "transaction_type": transaction_type,
        "date_from": date_from,
        "date_to": date_to,
        "sort_by": sort_by,
        "sort_order": sort_order
    }
    
    return TransactionService.get_transactions(db=db, pagination=pagination, **filters)

@router.put("/{transaction_id}", response_model=APIResponse)
def update_transaction(
    transaction_id: int = Path(..., gt=0),
    transaction_update: TransactionUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role)
):
    """Update a transaction"""
    return TransactionService.update_transaction(
        db=db,
        transaction_id=transaction_id,
        transaction_update=transaction_update,
        updated_by_id=current_user_id,
        user_role=current_user_role
    )

@router.delete("/{transaction_id}", response_model=APIResponse)
def cancel_transaction(
    transaction_id: int = Path(..., gt=0),
    reason: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    """Cancel a transaction"""
    return TransactionService.cancel_transaction(
        db=db,
        transaction_id=transaction_id,
        reason=reason,
        user_role=current_user_role
    )

@router.put("/{transaction_id}/payment", response_model=APIResponse)
def update_payment(
    transaction_id: int = Path(..., gt=0),
    payment_data: PaymentUpdateRequest = Body(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role)
):
    """Update payment information for a transaction"""
    try:
        from ..crud.transaction_crud import TransactionCRUD
        
        # Get transaction
        transaction = TransactionCRUD.get_by_id(db, transaction_id)
        if not transaction:
            return APIResponse(success=False, message="Transaction not found")
        
        # Permission check
        if current_user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied")
        
        # Update payment fields
        update_data = {}
        if payment_data.buyer_paid_amount is not None:
            update_data['buyer_paid_amount'] = payment_data.buyer_paid_amount
        if payment_data.farmer_paid_amount is not None:
            update_data['farmer_paid_amount'] = payment_data.farmer_paid_amount
        if payment_data.payment_status is not None:
            update_data['payment_status'] = payment_data.payment_status.value if isinstance(payment_data.payment_status, PaymentStatus) else payment_data.payment_status
        
        # Update transaction
        updated_transaction = TransactionCRUD.update(db, transaction_id, update_data)
        db.commit()
        
        return APIResponse(
            success=True,
            message="Payment updated successfully",
            data={"transaction_id": transaction_id}
        )
        
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Failed to update payment: {str(e)}")

@router.put("/{transaction_id}/confirm-commission", response_model=APIResponse)
def confirm_commission(
    transaction_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role)
):
    """Confirm commission for a transaction"""
    return TransactionService.confirm_commission(
        db=db,
        transaction_id=transaction_id,
        confirmed_by_id=current_user_id,
        user_role=current_user_role
    )

@router.get("/{transaction_id}/summary", response_model=APIResponse)
def get_transaction_summary(
    transaction_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get comprehensive transaction financial summary"""
    return TransactionService.get_transaction_summary(db=db, transaction_id=transaction_id)

@router.put("/bulk-update", response_model=APIResponse)
def bulk_update_transactions(
    bulk_request: BulkUpdateRequest = Body(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role)
):
    """Bulk update multiple transactions"""
    try:
        from ..crud.transaction_crud import TransactionCRUD
        
        # Permission check
        if current_user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied")
        
        updated_count = 0
        failed_updates = []
        
        for transaction_id in bulk_request.transaction_ids:
            try:
                transaction = TransactionCRUD.get_by_id(db, transaction_id)
                if transaction:
                    TransactionCRUD.update(db, transaction_id, bulk_request.update_data.dict(exclude_unset=True))
                    updated_count += 1
                else:
                    failed_updates.append({"id": transaction_id, "reason": "Transaction not found"})
            except Exception as e:
                failed_updates.append({"id": transaction_id, "reason": str(e)})
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Bulk update completed. {updated_count} transactions updated.",
            data={
                "updated_count": updated_count,
                "failed_updates": failed_updates
            }
        )
        
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Bulk update failed: {str(e)}")

@router.get("/analytics/summary", response_model=APIResponse)
def get_transaction_analytics(
    shop_id: Optional[int] = Query(None, gt=0),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get transaction analytics and statistics"""
    return TransactionService.get_transaction_analytics(
        db=db,
        shop_id=shop_id,
        days=days
    )

@router.get("/incomplete/list", response_model=APIResponse)
def get_incomplete_transactions(
    shop_id: Optional[int] = Query(None, gt=0),
    action_required: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get transactions requiring completion actions"""
    pagination = PaginationParams(page=page, limit=limit)
    
    return TransactionService.get_incomplete_transactions(
        db=db,
        shop_id=shop_id,
        action_required=action_required,
        pagination=pagination
    )

@router.get("/shop/{shop_id}/dashboard", response_model=APIResponse)
def get_shop_dashboard(
    shop_id: int = Path(..., gt=0),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get comprehensive shop dashboard statistics"""
    return TransactionService.get_shop_dashboard(
        db=db,
        shop_id=shop_id,
        date_from=date_from,
        date_to=date_to
    )

@router.get("/export/csv", response_model=APIResponse)
def export_transactions_csv(
    shop_id: Optional[int] = Query(None, gt=0),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    status_filter: Optional[TransactionStatus] = Query(None),
    db: Session = Depends(get_db)
):
    """Export transactions to CSV format"""
    try:
        import csv
        import io
        from fastapi.responses import StreamingResponse
        
        # Get transactions based on filters
        filters = {
            "shop_id": shop_id,
            "date_from": date_from,
            "date_to": date_to,
            "status": status_filter.value if status_filter else None
        }
        
        pagination = PaginationParams(page=1, limit=10000)  # Large limit
        transactions = TransactionService.get_transactions(db=db, pagination=pagination, **filters).data
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Transaction ID", "Shop ID", "Buyer ID", "Status", "Payment Status", "Completion Status", "Transaction Type", "Date Created", "Date Updated", "Buyer Paid Amount", "Farmer Paid Amount"])
        
        for transaction in transactions:
            writer.writerow([
                transaction.id,
                transaction.shop_id,
                transaction.buyer_id,
                transaction.status,
                transaction.payment_status,
                transaction.completion_status,
                transaction.transaction_type,
                transaction.created_at.strftime("%Y-%m-%d %H:%M:%S") if transaction.created_at else "",
                transaction.updated_at.strftime("%Y-%m-%d %H:%M:%S") if transaction.updated_at else "",
                transaction.buyer_paid_amount,
                transaction.farmer_paid_amount
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions_export.csv"}
        )
        
    except Exception as e:
        return APIResponse(success=False, message=f"CSV export failed: {str(e)}")
