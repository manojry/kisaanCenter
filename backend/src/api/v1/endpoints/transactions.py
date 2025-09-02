
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....database import get_db
from ....services.transaction_service import TransactionService
from ....schemas.transaction import QuickSaleRequest

router = APIRouter()

@router.post("/quick-sale")
async def process_quick_sale(
    sale_data: QuickSaleRequest,
    db: Session = Depends(get_db)
):
    """
    Fast transaction entry - replaces manual book entry
    Expected payload:
    {
        "shop_id": 1,
        "farmer_id": 2,
        "buyer_id": 3,
        "items": [
            {"product_id": 1, "quantity": 10.5, "rate": 25.0}
        ],
        "payment_mode": "cash"  // or "credit"
    }
    """
    try:
        service = TransactionService(db)
        transaction = service.process_quick_sale(
            shop_id=sale_data.shop_id,
            farmer_id=sale_data.farmer_id,
            buyer_id=sale_data.buyer_id,
            items=sale_data.items,
            payment_mode=sale_data.payment_mode
        )
        return transaction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{transaction_id}/cancel")
async def cancel_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Cancel/edit transaction - updates all related balances"""
    # Implementation for transaction cancellation
    pass
