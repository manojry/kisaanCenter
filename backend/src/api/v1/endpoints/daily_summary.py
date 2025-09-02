
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from database.connection import get_db
from services.daily_summary_service import DailySummaryService

router = APIRouter()

@router.get("/daily-summary")
async def get_daily_summary(
    shop_id: int,
    summary_date: date = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    End-of-day cash reconciliation - replaces manual book balancing
    Critical for shop owners to match physical cash with system records
    """
    service = DailySummaryService(db)
    return service.get_daily_summary(shop_id, summary_date)

@router.get("/weekly-summary")
async def get_weekly_summary(
    shop_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    """Weekly summary for farmer settlements and business analysis"""
    service = DailySummaryService(db)
    return service.get_weekly_summary(shop_id, start_date, end_date)

@router.get("/outstanding-credits")
async def get_outstanding_credits(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get all outstanding buyer credits - important for cash flow"""
    service = DailySummaryService(db)
    return service.get_outstanding_credits(shop_id)
