"""
Owner Analytics & Reporting API

This module provides comprehensive analytics and reporting APIs for shop owners,
including dashboard analytics, sales reports, farmer performance analysis, and inventory reports.

Features:
- Dashboard analytics with key metrics
- Sales performance reports
- Farmer performance analysis
- Inventory and stock reports
- Financial performance tracking
- Transaction trend analysis
- Custom date range reporting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, distinct
from typing import List, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..models import (
    Transaction, TransactionItem, FarmerStock, Product, User, Payment, 
    FarmerPayment, Credit, UserRole, TransactionStatus, PaymentStatus,
    CompletionStatus, StockStatus, RecordStatus
)
from ..services.user_service import UserService, get_current_user

router = APIRouter(prefix="/owner/analytics", tags=["Owner Analytics & Reporting"])

# Dashboard Analytics

@router.get("/dashboard", summary="Get comprehensive dashboard analytics")
async def get_dashboard_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard analytics for the specified number of days"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Key Performance Indicators
    
    # 1. Sales Metrics
    sales_query = db.query(Transaction).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
        Transaction.status == TransactionStatus.ACTIVE
    )
    
    total_transactions = sales_query.count()
    total_sales_amount = sales_query.with_entities(
        func.sum(Transaction.buyer_paid_amount)
    ).scalar() or 0
    
    total_commission = sales_query.with_entities(
        func.sum(Transaction.commission_amount)
    ).scalar() or 0
    
    # 2. User Metrics
    total_farmers = db.query(User).filter(
        User.shop_id == current_user.shop_id,
        User.role == UserRole.FARMER,
        User.status == RecordStatus.ACTIVE
    ).count()
    
    total_buyers = db.query(User).filter(
        User.shop_id == current_user.shop_id,
        User.role == UserRole.BUYER,
        User.status == RecordStatus.ACTIVE
    ).count()
    
    total_employees = db.query(User).filter(
        User.shop_id == current_user.shop_id,
        User.role == UserRole.EMPLOYEE,
        User.status == RecordStatus.ACTIVE
    ).count()
    
    # 3. Product & Stock Metrics
    total_products = db.query(Product).filter(
        Product.shop_id == current_user.shop_id,
        Product.status == RecordStatus.ACTIVE
    ).count()
    
    active_stocks = db.query(FarmerStock).filter(
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.status == StockStatus.ACTIVE
    ).count()
    
    total_stock_quantity = db.query(func.sum(FarmerStock.quantity)).filter(
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.status == StockStatus.ACTIVE
    ).scalar() or 0
    
    # 4. Financial Metrics
    outstanding_credits = db.query(Credit).join(User).filter(
        User.shop_id == current_user.shop_id,
        Credit.status == "outstanding"
    ).with_entities(func.sum(Credit.amount)).scalar() or 0
    
    farmer_payouts = db.query(FarmerPayment).join(User).filter(
        User.shop_id == current_user.shop_id,
        FarmerPayment.date >= start_date,
        FarmerPayment.date <= end_date
    ).with_entities(func.sum(FarmerPayment.amount)).scalar() or 0
    
    # 5. Transaction Completion Metrics
    completed_transactions = sales_query.filter(
        Transaction.completion_status == CompletionStatus.COMPLETE
    ).count()
    
    pending_transactions = sales_query.filter(
        Transaction.completion_status == CompletionStatus.PENDING
    ).count()
    
    completion_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "days": days
        },
        "sales_metrics": {
            "total_transactions": total_transactions,
            "total_sales_amount": float(total_sales_amount),
            "total_commission": float(total_commission),
            "average_transaction_value": float(total_sales_amount / total_transactions) if total_transactions > 0 else 0
        },
        "user_metrics": {
            "total_farmers": total_farmers,
            "total_buyers": total_buyers,
            "total_employees": total_employees,
            "total_users": total_farmers + total_buyers + total_employees
        },
        "inventory_metrics": {
            "total_products": total_products,
            "active_stocks": active_stocks,
            "total_stock_quantity": float(total_stock_quantity)
        },
        "financial_metrics": {
            "outstanding_credits": float(outstanding_credits),
            "farmer_payouts": float(farmer_payouts),
            "net_profit": float(total_commission),
            "cash_flow": float(total_sales_amount - farmer_payouts)
        },
        "completion_metrics": {
            "completed_transactions": completed_transactions,
            "pending_transactions": pending_transactions,
            "completion_rate": round(completion_rate, 2)
        }
    }

# Sales Reports

@router.get("/sales/daily", summary="Get daily sales report")
async def get_daily_sales_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily sales breakdown"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Default to last 30 days if no dates provided
    if not to_date:
        to_date = date.today()
    if not from_date:
        from_date = to_date - timedelta(days=30)
    
    # Daily sales aggregation
    daily_sales = db.query(
        Transaction.date,
        func.count(Transaction.id).label('transaction_count'),
        func.sum(Transaction.buyer_paid_amount).label('total_sales'),
        func.sum(Transaction.commission_amount).label('total_commission')
    ).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= from_date,
        Transaction.date <= to_date,
        Transaction.status == TransactionStatus.ACTIVE
    ).group_by(Transaction.date).order_by(Transaction.date.desc()).all()
    
    return {
        "period": {
            "from_date": from_date,
            "to_date": to_date
        },
        "daily_sales": [
            {
                "date": ds.date,
                "transaction_count": ds.transaction_count,
                "total_sales": float(ds.total_sales or 0),
                "total_commission": float(ds.total_commission or 0)
            } for ds in daily_sales
        ]
    }

@router.get("/sales/products", summary="Get product-wise sales report")
async def get_product_sales_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product-wise sales performance"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Default to last 30 days if no dates provided
    if not to_date:
        to_date = date.today()
    if not from_date:
        from_date = to_date - timedelta(days=30)
    
    # Product sales aggregation
    query = db.query(
        Product.id,
        Product.name,
        func.count(TransactionItem.id).label('item_count'),
        func.sum(TransactionItem.quantity).label('total_quantity'),
        func.sum(TransactionItem.quantity * TransactionItem.price).label('total_revenue')
    ).join(TransactionItem).join(Transaction).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= from_date,
        Transaction.date <= to_date,
        Transaction.status == TransactionStatus.ACTIVE
    ).group_by(Product.id, Product.name).order_by(
        func.sum(TransactionItem.quantity * TransactionItem.price).desc()
    )
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    product_sales = query.offset(offset).limit(limit).all()
    
    return {
        "period": {
            "from_date": from_date,
            "to_date": to_date
        },
        "product_sales": [
            {
                "product_id": ps.id,
                "product_name": ps.name,
                "item_count": ps.item_count,
                "total_quantity": float(ps.total_quantity or 0),
                "total_revenue": float(ps.total_revenue or 0)
            } for ps in product_sales
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

# Farmer Performance Reports

@router.get("/farmers/performance", summary="Get farmer performance report")
async def get_farmer_performance_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get farmer performance analytics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Default to last 30 days if no dates provided
    if not to_date:
        to_date = date.today()
    if not from_date:
        from_date = to_date - timedelta(days=30)
    
    # Farmer performance aggregation
    query = db.query(
        User.id,
        User.username,
        func.count(distinct(FarmerStock.id)).label('stock_entries'),
        func.sum(FarmerStock.quantity).label('total_quantity_delivered'),
        func.count(distinct(TransactionItem.transaction_id)).label('transactions_involved'),
        func.sum(TransactionItem.quantity * TransactionItem.price).label('total_sales_value'),
        func.sum(FarmerPayment.amount).label('total_payouts')
    ).outerjoin(FarmerStock).outerjoin(TransactionItem).outerjoin(FarmerPayment).filter(
        User.shop_id == current_user.shop_id,
        User.role == UserRole.FARMER,
        User.status == RecordStatus.ACTIVE
    )
    
    # Apply date filters
    if from_date and to_date:
        query = query.filter(
            func.coalesce(FarmerStock.date, from_date) >= from_date,
            func.coalesce(FarmerStock.date, to_date) <= to_date
        )
    
    query = query.group_by(User.id, User.username).order_by(
        func.sum(TransactionItem.quantity * TransactionItem.price).desc()
    )
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    farmer_performance = query.offset(offset).limit(limit).all()
    
    return {
        "period": {
            "from_date": from_date,
            "to_date": to_date
        },
        "farmer_performance": [
            {
                "farmer_id": fp.id,
                "farmer_username": fp.username,
                "stock_entries": fp.stock_entries or 0,
                "total_quantity_delivered": float(fp.total_quantity_delivered or 0),
                "transactions_involved": fp.transactions_involved or 0,
                "total_sales_value": float(fp.total_sales_value or 0),
                "total_payouts": float(fp.total_payouts or 0),
                "pending_payout": float((fp.total_sales_value or 0) - (fp.total_payouts or 0))
            } for fp in farmer_performance
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/farmers/{farmer_id}/detailed", summary="Get detailed farmer report")
async def get_farmer_detailed_report(
    farmer_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed report for a specific farmer"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Verify farmer belongs to shop
    farmer = db.query(User).filter(
        User.id == farmer_id,
        User.shop_id == current_user.shop_id,
        User.role == UserRole.FARMER
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Default to last 30 days if no dates provided
    if not to_date:
        to_date = date.today()
    if not from_date:
        from_date = to_date - timedelta(days=30)
    
    # Stock deliveries
    stock_deliveries = db.query(FarmerStock).filter(
        FarmerStock.farmer_user_id == farmer_id,
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.date >= from_date,
        FarmerStock.date <= to_date
    ).order_by(FarmerStock.date.desc()).all()
    
    # Transaction involvement
    transaction_items = db.query(TransactionItem).join(Transaction).filter(
        TransactionItem.farmer_stock_id.in_([stock.id for stock in stock_deliveries]),
        Transaction.shop_id == current_user.shop_id
    ).all()
    
    # Payouts received
    payouts = db.query(FarmerPayment).filter(
        FarmerPayment.farmer_user_id == farmer_id,
        FarmerPayment.date >= from_date,
        FarmerPayment.date <= to_date
    ).order_by(FarmerPayment.date.desc()).all()
    
    # Calculate totals
    total_delivered = sum(stock.quantity for stock in stock_deliveries)
    total_sold = sum(item.quantity for item in transaction_items)
    total_sales_value = sum(item.quantity * item.price for item in transaction_items)
    total_payouts = sum(payout.amount for payout in payouts)
    
    return {
        "farmer": {
            "id": farmer.id,
            "username": farmer.username,
            "contact": farmer.contact,
            "status": farmer.status
        },
        "period": {
            "from_date": from_date,
            "to_date": to_date
        },
        "summary": {
            "total_delivered": float(total_delivered),
            "total_sold": float(total_sold),
            "remaining_stock": float(total_delivered - total_sold),
            "total_sales_value": float(total_sales_value),
            "total_payouts": float(total_payouts),
            "pending_payout": float(total_sales_value - total_payouts)
        },
        "stock_deliveries": [
            {
                "id": stock.id,
                "product_id": stock.product_id,
                "quantity": float(stock.quantity),
                "date": stock.date,
                "status": stock.status
            } for stock in stock_deliveries
        ],
        "recent_payouts": [
            {
                "id": payout.id,
                "amount": float(payout.amount),
                "payment_type": payout.payment_type,
                "date": payout.date,
                "remarks": payout.remarks
            } for payout in payouts[:10]  # Last 10 payouts
        ]
    }

# Inventory Reports

@router.get("/inventory/status", summary="Get inventory status report")
async def get_inventory_status_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current inventory status and stock levels"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Stock status summary
    stock_summary = db.query(
        FarmerStock.status,
        func.count(FarmerStock.id).label('count'),
        func.sum(FarmerStock.quantity).label('total_quantity')
    ).filter(
        FarmerStock.shop_id == current_user.shop_id
    ).group_by(FarmerStock.status).all()
    
    # Product-wise stock levels
    product_stocks = db.query(
        Product.id,
        Product.name,
        func.count(FarmerStock.id).label('stock_entries'),
        func.sum(case([(FarmerStock.status == StockStatus.ACTIVE, FarmerStock.quantity)], else_=0)).label('active_quantity'),
        func.sum(FarmerStock.quantity).label('total_quantity')
    ).outerjoin(FarmerStock).filter(
        Product.shop_id == current_user.shop_id,
        Product.status == RecordStatus.ACTIVE
    ).group_by(Product.id, Product.name).all()
    
    # Low stock products (less than 10 units)
    low_stock_products = [
        product for product in product_stocks 
        if (product.active_quantity or 0) < 10
    ]
    
    return {
        "stock_summary": [
            {
                "status": ss.status,
                "count": ss.count,
                "total_quantity": float(ss.total_quantity or 0)
            } for ss in stock_summary
        ],
        "product_stocks": [
            {
                "product_id": ps.id,
                "product_name": ps.name,
                "stock_entries": ps.stock_entries or 0,
                "active_quantity": float(ps.active_quantity or 0),
                "total_quantity": float(ps.total_quantity or 0)
            } for ps in product_stocks
        ],
        "alerts": {
            "low_stock_count": len(low_stock_products),
            "low_stock_products": [
                {
                    "product_id": lsp.id,
                    "product_name": lsp.name,
                    "active_quantity": float(lsp.active_quantity or 0)
                } for lsp in low_stock_products[:10]  # Top 10 low stock items
            ]
        }
    }

# Financial Performance Reports

@router.get("/financial/trends", summary="Get financial trends report")
async def get_financial_trends_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly)$"),
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financial trends over time"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func, extract
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)
    
    # Group by period
    if period == "daily":
        date_trunc = Transaction.date
    elif period == "weekly":
        date_trunc = func.date_trunc('week', Transaction.date)
    else:  # monthly
        date_trunc = func.date_trunc('month', Transaction.date)
    
    # Financial trends aggregation
    trends = db.query(
        date_trunc.label('period'),
        func.count(Transaction.id).label('transaction_count'),
        func.sum(Transaction.buyer_paid_amount).label('revenue'),
        func.sum(Transaction.commission_amount).label('commission'),
        func.sum(case([(Transaction.completion_status == CompletionStatus.COMPLETE, 1)], else_=0)).label('completed_transactions')
    ).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
        Transaction.status == TransactionStatus.ACTIVE
    ).group_by(date_trunc).order_by(date_trunc).all()
    
    # Calculate growth rates
    trend_data = []
    for i, trend in enumerate(trends):
        growth_rate = 0
        if i > 0 and trends[i-1].revenue and trends[i-1].revenue > 0:
            growth_rate = ((trend.revenue - trends[i-1].revenue) / trends[i-1].revenue) * 100
        
        trend_data.append({
            "period": trend.period,
            "transaction_count": trend.transaction_count,
            "revenue": float(trend.revenue or 0),
            "commission": float(trend.commission or 0),
            "completed_transactions": trend.completed_transactions,
            "completion_rate": (trend.completed_transactions / trend.transaction_count * 100) if trend.transaction_count > 0 else 0,
            "growth_rate": round(growth_rate, 2)
        })
    
    return {
        "period_type": period,
        "date_range": {
            "start_date": start_date,
            "end_date": end_date,
            "months": months
        },
        "trends": trend_data
    }