
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database.connection import get_db
from src.features.transactions.schemas.transaction_schemas import TransactionCreate, TransactionResponse
from src.features.stock.services.transaction_stock_service import TransactionStockService
from src.core.auth import get_current_user
from src.core.exceptions import ValidationError, BusinessRuleError

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionResponse)
async def create_transaction_with_stock_update(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create transaction and automatically update farmer stock records
    
    This endpoint:
    1. Validates transaction data
    2. Creates/updates farmer stock records for each item
    3. Handles both declared and implicit stock flows
    4. Creates comprehensive audit trail
    5. Returns complete transaction with stock status
    """
    
    try:
        transaction = TransactionStockService.create_transaction_with_stock_update(
            db=db,
            transaction_data=transaction_data,
            created_by_id=current_user.id
        )
        
        return TransactionResponse.from_orm(transaction)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during transaction creation"
        )

@router.post("/stock/{stock_id}/declare", response_model=dict)
async def declare_stock_late(
    stock_id: int,
    declared_qty: float,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add late declaration to existing implicit stock record
    
    Allows farmers to declare their starting inventory after sales have begun
    """
    
    try:
        stock = TransactionStockService.declare_stock_late(
            db=db,
            stock_id=stock_id,
            declared_qty=declared_qty,
            declared_by_id=current_user.id,
            notes=notes
        )
        
        return {
            "success": True,
            "message": f"Stock declaration added: {declared_qty} units",
            "stock_id": stock.id,
            "balance_qty": float(stock.balance_qty) if stock.balance_qty else None
        }
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
