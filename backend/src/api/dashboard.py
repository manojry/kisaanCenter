from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Shop, Transaction, TransactionItem, Payment, Product, RecordStatus
from ..schemas import APIResponse, ErrorResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(
    "/stats",
    response_model=APIResponse,
    summary="Get dashboard statistics",
    description="Get comprehensive dashboard statistics for all entities",
    response_description="Dashboard statistics data"
)
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics including:
    - Total and active users
    - Total and active shops  
    - Transaction counts and revenue
    - Payment statistics
    """
    try:
        logger.info("🔄 Fetching dashboard statistics...")
        
        # Get user statistics
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.status == RecordStatus.ACTIVE).scalar() or 0
        
        # Get shop statistics
        total_shops = db.query(func.count(Shop.id)).scalar() or 0
        active_shops = db.query(func.count(Shop.id)).filter(Shop.status == RecordStatus.ACTIVE).scalar() or 0
        
        # Get transaction statistics
        total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
        
        # Calculate total revenue from transaction items (quantity * price)
        total_revenue = db.query(
            func.sum(TransactionItem.quantity * TransactionItem.price)
        ).join(Transaction).scalar() or 0.0
        
        total_commission = db.query(func.sum(Transaction.commission_amount)).scalar() or 0.0
        
        # Get payment statistics
        pending_payments = db.query(func.count(Payment.id)).filter(
            Payment.status == 'pending'
        ).scalar() or 0
        
        stats = {
            "total_users": total_users,
            "active_users": active_users,
            "total_shops": total_shops,
            "active_shops": active_shops,
            "total_transactions": total_transactions,
            "total_revenue": float(total_revenue),
            "total_commission": float(total_commission),
            "pending_payments": pending_payments
        }
        
        logger.info(f"✅ Dashboard stats retrieved: {stats}")
        
        return APIResponse(
            success=True,
            message="Dashboard statistics retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )

@router.get(
    "/owner/{shop_id}",
    response_model=APIResponse,
    summary="Get owner dashboard",
    description="Get dashboard statistics specific to a shop owner",
)
async def get_owner_dashboard(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get dashboard data specific to a shop owner"""
    try:
        # Verify shop exists
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )
        
        # Get shop-specific statistics
        shop_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.shop_id == shop_id
        ).scalar() or 0
        
        shop_revenue = db.query(
            func.sum(TransactionItem.quantity * TransactionItem.price)
        ).join(Transaction).filter(
            Transaction.shop_id == shop_id
        ).scalar() or 0.0
        
        shop_products = db.query(func.count(Product.id)).filter(
            Product.shop_id == shop_id
        ).scalar() or 0
        
        today = datetime.now().date()
        today_transactions = db.query(func.count(Transaction.id)).filter(
            and_(
                Transaction.shop_id == shop_id,
                func.date(Transaction.created_at) == today
            )
        ).scalar() or 0
        
        owner_dashboard = {
            "shop_stats": {
                "shop_id": shop_id,
                "shop_name": shop.shop_name,
                "total_transactions": shop_transactions,
                "total_revenue": float(shop_revenue),
                "total_products": shop_products,
                "today_transactions": today_transactions,
                "is_active": shop.status == RecordStatus.ACTIVE
            }
        }
        
        return APIResponse(
            success=True,
            message="Owner dashboard retrieved successfully",
            data=owner_dashboard
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching owner dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch owner dashboard: {str(e)}"
        )

@router.get(
    "/health",
    response_model=APIResponse,
    summary="Get system health",
    description="Get system health and status information"
)
async def get_system_health(db: Session = Depends(get_db)):
    """Get system health information"""
    try:
        # Basic health checks
        db_healthy = True
        try:
            db.execute("SELECT 1")
        except:
            db_healthy = False
        
        # Get recent activity
        recent_users = db.query(func.count(User.id)).filter(
            User.created_at >= datetime.now() - timedelta(days=7)
        ).scalar() or 0
        
        recent_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.created_at >= datetime.now() - timedelta(days=1)
        ).scalar() or 0
        
        health_data = {
            "database_healthy": db_healthy,
            "api_status": "operational",
            "recent_users_7_days": recent_users,
            "recent_transactions_24h": recent_transactions,
            "timestamp": datetime.now().isoformat()
        }
        
        return APIResponse(
            success=True,
            message="System health retrieved successfully",
            data=health_data
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting system health: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system health: {str(e)}"
        )

@router.get(
    "/superadmin",
    response_model=APIResponse,
    summary="Get superadmin dashboard",
    description="Get comprehensive dashboard for superadmin with cross-shop analytics",
    response_description="Superadmin dashboard data"
)
async def get_superadmin_dashboard(
    db: Session = Depends(get_db)
):
    """
    Get comprehensive superadmin dashboard with:
    - System-wide statistics
    - Shop performance analytics
    - Financial overview
    - User management metrics
    - Transaction completion analytics
    - System health indicators
    """
    try:
        logger.info("🔄 Fetching superadmin dashboard data...")
        
        # 1. System Overview
        total_shops = db.query(func.count(Shop.id)).scalar() or 0
        active_shops = db.query(func.count(Shop.id)).filter(Shop.status == RecordStatus.ACTIVE).scalar() or 0
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.status == RecordStatus.ACTIVE).scalar() or 0
        
        # 2. Financial Overview
        total_revenue = db.query(
            func.sum(TransactionItem.quantity * TransactionItem.price)
        ).join(Transaction).scalar() or 0.0
        total_commission = db.query(func.sum(Transaction.commission_amount)).scalar() or 0.0
        
        # 3. Transaction Analytics
        total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
        completed_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.completion_status == 'complete'
        ).scalar() or 0
        pending_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.completion_status == 'pending'
        ).scalar() or 0
        partial_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.completion_status == 'partial'
        ).scalar() or 0
        
        # 4. Shop Performance Analytics
        shop_performance = db.query(
            Shop.id,
            Shop.name,
            func.count(Transaction.id).label('transaction_count'),
            func.sum(TransactionItem.quantity * TransactionItem.price).label('shop_revenue'),
            func.sum(Transaction.commission_amount).label('commission_earned')
        ).outerjoin(Transaction).outerjoin(TransactionItem).filter(
            Shop.status == RecordStatus.ACTIVE
        ).group_by(Shop.id, Shop.name).limit(10).all()
        
        shop_performance_data = [
            {
                'shop_id': shop.id,
                'shop_name': shop.name,
                'transaction_count': shop.transaction_count or 0,
                'revenue': float(shop.shop_revenue or 0),
                'commission': float(shop.commission_earned or 0)
            }
            for shop in shop_performance
        ]
        
        # 5. Recent Activity (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_shops = db.query(func.count(Shop.id)).filter(
            Shop.created_at >= week_ago
        ).scalar() or 0
        recent_users = db.query(func.count(User.id)).filter(
            User.created_at >= week_ago
        ).scalar() or 0
        recent_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.created_at >= week_ago
        ).scalar() or 0
        
        # 6. Pending Actions (Admin attention required)
        pending_approvals = 0  # Placeholder for shop approvals if needed
        system_alerts = 0      # Placeholder for system alerts
        
        # Check for shops with incomplete transactions
        shops_with_pending = db.query(func.count(func.distinct(Transaction.shop_id))).filter(
            Transaction.completion_status.in_(['pending', 'partial'])
        ).scalar() or 0
        
        # 7. Commission Analytics
        commission_pending = db.query(func.sum(Transaction.commission_amount)).filter(
            Transaction.commission_confirmed == False,
            Transaction.buyer_paid_amount > 0
        ).scalar() or 0.0
        
        commission_confirmed = db.query(func.sum(Transaction.commission_amount)).filter(
            Transaction.commission_confirmed == True
        ).scalar() or 0.0
        
        # 8. Payment Analytics
        total_buyer_payments = db.query(func.sum(Transaction.buyer_paid_amount)).scalar() or 0.0
        total_farmer_payments = db.query(func.sum(Transaction.farmer_paid_amount)).scalar() or 0.0
        
        # Calculate completion percentage
        completion_percentage = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
        
        dashboard_data = {
            "system_overview": {
                "total_shops": total_shops,
                "active_shops": active_shops,
                "total_users": total_users,
                "active_users": active_users,
                "shop_utilization_rate": (active_shops / total_shops * 100) if total_shops > 0 else 0
            },
            "financial_overview": {
                "total_revenue": float(total_revenue),
                "total_commission": float(total_commission),
                "commission_confirmed": float(commission_confirmed),
                "commission_pending": float(commission_pending),
                "commission_rate": (total_commission / total_revenue * 100) if total_revenue > 0 else 0
            },
            "transaction_analytics": {
                "total_transactions": total_transactions,
                "completed_transactions": completed_transactions,
                "pending_transactions": pending_transactions,
                "partial_transactions": partial_transactions,
                "completion_percentage": round(completion_percentage, 2)
            },
            "payment_analytics": {
                "total_buyer_payments": float(total_buyer_payments),
                "total_farmer_payments": float(total_farmer_payments),
                "payment_gap": float(total_buyer_payments - total_farmer_payments)
            },
            "shop_performance": shop_performance_data,
            "recent_activity": {
                "new_shops_7_days": recent_shops,
                "new_users_7_days": recent_users,
                "new_transactions_7_days": recent_transactions
            },
            "pending_actions": {
                "pending_approvals": pending_approvals,
                "system_alerts": system_alerts,
                "shops_with_pending_transactions": shops_with_pending
            },
            "system_health": {
                "api_status": "operational",
                "database_status": "healthy",
                "last_updated": datetime.now().isoformat()
            }
        }
        
        logger.info("✅ Superadmin dashboard data retrieved successfully")
        
        return APIResponse(
            success=True,
            message="Superadmin dashboard retrieved successfully",
            data=dashboard_data
        )
        
    except Exception as e:
        logger.error(f"❌ Error fetching superadmin dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch superadmin dashboard: {str(e)}"
        )
