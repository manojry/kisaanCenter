
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.src.database import get_db
from backend.src.schemas import APIResponse
from backend.src.services.transaction_service import TransactionService
from datetime import datetime

router = APIRouter(prefix="/owner-transactions", tags=["Owner Transactions"])

# Get transactions for today
@router.get("/transactions", response_model=APIResponse)
def get_transactions_today(
	shop_id: int = Query(..., description="Shop ID"),
	date: str = Query("today", description="Date filter, use 'today' for current date"),
	db: Session = Depends(get_db)
):
	"""Get transactions for today for a shop"""
	if date == "today":
		today = datetime.now().date()
		transactions = TransactionService(db).get_transactions_by_date(shop_id, today)
		return APIResponse(success=True, message="Today's transactions retrieved", data=transactions)
	return APIResponse(success=False, message="Only 'today' filter is supported", data=[])
