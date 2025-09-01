
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from database.connection import get_db
from services.farmer_ledger_service import FarmerLedgerService
from services.farmer_stock_service import FarmerStockService
from schemas.farmer_schemas import FarmerStockDeclarationRequest, FarmerPaymentRequest

router = APIRouter()

@router.get("/{farmer_id}/balance")
async def get_farmer_balance(
    farmer_id: int,
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get real-time farmer balance - replaces manual calculation"""
    service = FarmerLedgerService(db)
    return service.get_farmer_balance(farmer_id, shop_id)

@router.get("/{farmer_id}/ledger")
async def get_farmer_ledger(
    farmer_id: int,
    shop_id: int,
    from_date: date = None,
    to_date: date = None,
    db: Session = Depends(get_db)
):
    """Get farmer transaction history - replaces physical book"""
    service = FarmerLedgerService(db)
    return service.get_farmer_ledger(farmer_id, shop_id, from_date, to_date)

@router.post("/{farmer_id}/declare-stock")
async def declare_farmer_stock(
    farmer_id: int,
    stock_data: FarmerStockDeclarationRequest,
    db: Session = Depends(get_db)
):
    """Morning stock declaration - optional feature"""
    try:
        service = FarmerStockService(db)
        result = service.declare_stock(farmer_id, stock_data.items)
        return {"message": "Stock declared successfully", "items": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{farmer_id}/settle-payment")
async def settle_farmer_payment(
    farmer_id: int,
    payment_data: FarmerPaymentRequest,
    db: Session = Depends(get_db)
):
    """Process farmer payment - deduct from balance"""
    try:
        service = FarmerLedgerService(db)
        payment = service.process_farmer_payment(farmer_id, payment_data)
        return {"message": "Payment processed successfully", "payment": payment}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{farmer_id}/stock")
async def get_farmer_stock(
    farmer_id: int,
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get farmer's current stock status"""
    service = FarmerStockService(db)
    return service.get_farmer_stock_summary(farmer_id, shop_id)
