from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timedelta
from ..database import get_db
from ..services import TransactionService
from ..schemas import APIResponse
from ..models import Transaction
from sqlalchemy import func, and_, extract
from decimal import Decimal

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/sales")
async def get_sales_report(
    period: str = Query("monthly", description="Report period: daily, weekly, monthly, yearly"),
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    start_date: Optional[date] = Query(None, description="Start date for custom period"),
    end_date: Optional[date] = Query(None, description="End date for custom period"),
    db: Session = Depends(get_db)
):
    """Get sales report with various time periods"""
    try:
        # Determine date range based on period
        end_date_actual = end_date or date.today()
        
        if period == "daily":
            start_date_actual = start_date or (end_date_actual - timedelta(days=30))
        elif period == "weekly":
            start_date_actual = start_date or (end_date_actual - timedelta(weeks=12))
        elif period == "yearly":
            start_date_actual = start_date or (end_date_actual - timedelta(days=365*2))
        else:  # monthly
            start_date_actual = start_date or (end_date_actual - timedelta(days=365))
        
        # Base query
        query = db.query(Transaction).filter(
            and_(
                Transaction.date >= start_date_actual,
                Transaction.date <= end_date_actual,
                Transaction.status != 'deleted'
            )
        )
        
        # Apply shop filter if provided
        if shop_id:
            query = query.filter(Transaction.shop_id == shop_id)
        
        # Get aggregated data by period
        if period == "daily":
            group_by_field = func.date(Transaction.date)
        elif period == "weekly":
            group_by_field = func.date_trunc('week', Transaction.date)
        elif period == "yearly":
            group_by_field = func.date_trunc('year', Transaction.date)
        else:  # monthly
            group_by_field = func.date_trunc('month', Transaction.date)
        
        sales_data = query.with_entities(
            group_by_field.label('period'),
            func.count(Transaction.id).label('total_transactions'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_amount'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_commission'),
            func.coalesce(func.sum(Transaction.buyer_paid_amount), 0).label('total_paid')
        ).group_by(group_by_field).order_by(group_by_field.desc()).all()
        
        # Format response
        formatted_data = []
        for row in sales_data:
            formatted_data.append({
                'period': row.period.strftime('%Y-%m-%d') if row.period else None,
                'total_transactions': int(row.total_transactions or 0),
                'total_amount': float(row.total_amount or 0),
                'total_commission': float(row.total_commission or 0),
                'total_paid': float(row.total_paid or 0)
            })
        
        # Get summary totals
        total_summary = query.with_entities(
            func.count(Transaction.id).label('total_transactions'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_amount'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_commission'),
            func.coalesce(func.sum(Transaction.buyer_paid_amount), 0).label('total_paid')
        ).first()
        
        return APIResponse(
            success=True,
            message="Sales report generated successfully",
            data={
                'period': period,
                'start_date': start_date_actual.strftime('%Y-%m-%d'),
                'end_date': end_date_actual.strftime('%Y-%m-%d'),
                'summary': {
                    'total_transactions': int(total_summary.total_transactions or 0),
                    'total_amount': float(total_summary.total_amount or 0),
                    'total_commission': float(total_summary.total_commission or 0),
                    'total_paid': float(total_summary.total_paid or 0)
                },
                'data': formatted_data
            }
        )
        
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to generate sales report: {str(e)}"
        )

@router.get("/financial")
async def get_financial_report(
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    db: Session = Depends(get_db)
):
    """Get financial report with revenue, commissions, and payments"""
    try:
        # Default to last 30 days if no dates provided
        end_date_actual = end_date or date.today()
        start_date_actual = start_date or (end_date_actual - timedelta(days=30))
        
        # Base query
        query = db.query(Transaction).filter(
            and_(
                Transaction.date >= start_date_actual,
                Transaction.date <= end_date_actual,
                Transaction.status != 'deleted'
            )
        )
        
        # Apply shop filter if provided
        if shop_id:
            query = query.filter(Transaction.shop_id == shop_id)
        
        # Get financial metrics
        financial_data = query.with_entities(
            func.count(Transaction.id).label('total_transactions'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_revenue'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('total_commission'),
            func.coalesce(func.sum(Transaction.buyer_paid_amount), 0).label('total_collected'),
            func.coalesce(func.sum(Transaction.farmer_paid_amount), 0).label('total_paid_to_farmers')
        ).first()
        
        # Calculate outstanding amounts
        outstanding_from_buyers = float(financial_data.total_revenue or 0) - float(financial_data.total_collected or 0)
        outstanding_to_farmers = float(financial_data.total_collected or 0) - float(financial_data.total_paid_to_farmers or 0) - float(financial_data.total_commission or 0)
        
        # Get payment status breakdown
        payment_status_query = query.with_entities(
            Transaction.payment_status,
            func.count(Transaction.id).label('count'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('amount')
        ).group_by(Transaction.payment_status).all()
        
        payment_breakdown = {}
        for row in payment_status_query:
            payment_breakdown[row.payment_status or 'unknown'] = {
                'count': int(row.count or 0),
                'amount': float(row.amount or 0)
            }
        
        return APIResponse(
            success=True,
            message="Financial report generated successfully",
            data={
                'period': {
                    'start_date': start_date_actual.strftime('%Y-%m-%d'),
                    'end_date': end_date_actual.strftime('%Y-%m-%d')
                },
                'summary': {
                    'total_transactions': int(financial_data.total_transactions or 0),
                    'total_revenue': float(financial_data.total_revenue or 0),
                    'total_commission': float(financial_data.total_commission or 0),
                    'total_collected': float(financial_data.total_collected or 0),
                    'total_paid_to_farmers': float(financial_data.total_paid_to_farmers or 0),
                    'outstanding_from_buyers': max(0, outstanding_from_buyers),
                    'outstanding_to_farmers': max(0, outstanding_to_farmers),
                    'net_position': float(financial_data.total_commission or 0)
                },
                'payment_status_breakdown': payment_breakdown
            }
        )
        
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to generate financial report: {str(e)}"
        )

@router.get("/dashboard")
async def get_dashboard_summary(
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    db: Session = Depends(get_db)
):
    """Get dashboard summary with key metrics"""
    try:
        # Get today's metrics
        today = date.today()
        
        # Base query for today
        today_query = db.query(Transaction).filter(
            and_(
                Transaction.date == today,
                Transaction.status != 'deleted'
            )
        )
        
        # Base query for this month
        month_start = today.replace(day=1)
        month_query = db.query(Transaction).filter(
            and_(
                Transaction.date >= month_start,
                Transaction.date <= today,
                Transaction.status != 'deleted'
            )
        )
        
        # Apply shop filter if provided
        if shop_id:
            today_query = today_query.filter(Transaction.shop_id == shop_id)
            month_query = month_query.filter(Transaction.shop_id == shop_id)
        
        # Get today's metrics
        today_metrics = today_query.with_entities(
            func.count(Transaction.id).label('transactions'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('revenue'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('commission')
        ).first()
        
        # Get month's metrics
        month_metrics = month_query.with_entities(
            func.count(Transaction.id).label('transactions'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('revenue'),
            func.coalesce(func.sum(Transaction.commission_amount), 0).label('commission')
        ).first()
        
        # Get pending transactions
        pending_count = db.query(Transaction).filter(
            and_(
                Transaction.payment_status == 'pending',
                Transaction.status != 'deleted'
            )
        ).count()
        
        return APIResponse(
            success=True,
            message="Dashboard summary generated successfully",
            data={
                'today': {
                    'transactions': int(today_metrics.transactions or 0),
                    'revenue': float(today_metrics.revenue or 0),
                    'commission': float(today_metrics.commission or 0)
                },
                'this_month': {
                    'transactions': int(month_metrics.transactions or 0),
                    'revenue': float(month_metrics.revenue or 0),
                    'commission': float(month_metrics.commission or 0)
                },
                'pending_transactions': pending_count
            }
        )
        
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Failed to generate dashboard summary: {str(e)}"
        )
