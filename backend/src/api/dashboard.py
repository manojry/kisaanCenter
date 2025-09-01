# --- Dashboard API Endpoints ---
#
# /dashboard/shop/{shop_id}         - Comprehensive shop dashboard metrics
# /dashboard/shop/{shop_id}/summary - Quick summary for dashboard widgets
# /dashboard/shop/{shop_id}/alerts  - Important alerts for dashboard
# /dashboard/health                 - System health info
#
# All endpoints return APIResponse { success, message, data }
#
# Example responses:
#   /dashboard/shop/1
#   {
#     "success": true,
#     "message": "Dashboard data retrieved successfully",
#     "data": { ...metrics... }
#   }
#
#   /dashboard/shop/1/summary
#   {
#     "success": true,
#     "message": "Dashboard summary retrieved",
#     "data": { ...summary... }
#   }
#
#   /dashboard/shop/1/alerts
#   {
#     "success": true,
#     "message": "Dashboard alerts retrieved",
#     "data": [ ...alerts... ]
#   }
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Shop, Transaction, TransactionItem, Payment, Product, RecordStatus
from ..schemas import APIResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# --- Improved Shop Dashboard Endpoint ---
@router.get("/shop/{shop_id}")
async def get_shop_dashboard(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard data for a shop.
    Returns all key metrics for the frontend dashboard.
    """
    try:
        if current_user.role not in ['superadmin', 'owner'] and current_user.shop_id != shop_id:
            raise HTTPException(status_code=403, detail="Access denied")

        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        today = datetime.now().date()
        month_start = today.replace(day=1)

        base_query = db.query(Transaction).filter(Transaction.shop_id == shop_id)

        today_transactions = base_query.filter(func.date(Transaction.created_at) == today).all()
        today_revenue = sum(float(t.total_amount or 0) for t in today_transactions)
        today_commission = sum(float(t.commission_amount or 0) for t in today_transactions)

        monthly_transactions = base_query.filter(func.date(Transaction.created_at) >= month_start).all()
        monthly_revenue = sum(float(t.total_amount or 0) for t in monthly_transactions)
        monthly_commission = sum(float(t.commission_amount or 0) for t in monthly_transactions)

        completed_count = base_query.filter(Transaction.completion_status == 'completed').count()
        pending_buyer_payments = base_query.filter(and_(
            Transaction.completion_status == 'incomplete',
            or_(Transaction.buyer_payment_status == 'pending', Transaction.buyer_payment_status == None)
        )).count()
        pending_farmer_payments = base_query.filter(and_(
            Transaction.completion_status == 'incomplete',
            Transaction.buyer_payment_status == 'completed',
            or_(Transaction.farmer_payment_status == 'pending', Transaction.farmer_payment_status == None)
        )).count()
        pending_commissions = base_query.filter(and_(
            Transaction.completion_status == 'incomplete',
            Transaction.buyer_payment_status == 'completed',
            Transaction.farmer_payment_status == 'completed',
            or_(Transaction.commission_confirmed == False, Transaction.commission_confirmed == None)
        )).count()

        shop_users = db.query(User).filter(User.shop_id == shop_id).all()
        farmers_count = len([u for u in shop_users if u.role == 'farmer'])
        buyers_count = len([u for u in shop_users if u.role == 'buyer'])
        employees_count = len([u for u in shop_users if u.role == 'employee'])

        pending_credits = sum(
            float(u.credit_limit or 0) - float(u.current_balance or 0)
            for u in shop_users
            if u.role in ['farmer', 'buyer'] and (u.credit_limit or 0) > (u.current_balance or 0)
        )

        active_stock = db.query(Product).filter(
            and_(Product.shop_id == shop_id, Product.is_active == True)
        ).count() if hasattr(Product, 'shop_id') else 0

        dashboard_data = {
            "shop_id": shop_id,
            "shop_name": shop.shop_name,
            "is_active": shop.status,
            "today_revenue": today_revenue,
            "today_commission": today_commission,
            "today_transactions": len(today_transactions),
            "monthly_revenue": monthly_revenue,
            "monthly_commission": monthly_commission,
            "monthly_transactions": len(monthly_transactions),
            "total_commission": monthly_commission,
            "pending_credits": pending_credits,
            "completed_transactions": completed_count,
            "pending_buyer_payments": pending_buyer_payments,
            "pending_farmer_payments": pending_farmer_payments,
            "pending_commission_confirmations": pending_commissions,
            "active_stock": active_stock,
            "total_farmers": farmers_count,
            "total_buyers": buyers_count,
            "total_employees": employees_count,
            "completion_rate": round(
                (completed_count / max(1, completed_count + pending_buyer_payments + pending_farmer_payments + pending_commissions)) * 100,
                1
            ),
            "average_transaction_value": round(
                monthly_revenue / max(1, len(monthly_transactions)),
                2
            ) if monthly_transactions else 0,
            "commission_rate": round(
                (monthly_commission / max(1, monthly_revenue)) * 100,
                2
            ) if monthly_revenue > 0 else 0
        }

        return {
            "success": True,
            "data": dashboard_data,
            "message": "Dashboard data retrieved successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

# --- Dashboard Summary Endpoint ---
@router.get("/shop/{shop_id}/summary")
async def get_dashboard_summary(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a quick summary for dashboard widgets.
    """
    try:
        if current_user.role not in ['superadmin', 'owner'] and current_user.shop_id != shop_id:
            raise HTTPException(status_code=403, detail="Access denied")

        total_transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).count()
        total_users = db.query(User).filter(User.shop_id == shop_id).count()
        week_ago = datetime.now() - timedelta(days=7)
        recent_transactions = db.query(Transaction).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.created_at >= week_ago
            )
        ).count()

        return {
            "success": True,
            "data": {
                "total_transactions": total_transactions,
                "total_users": total_users,
                "recent_activity": recent_transactions,
                "last_updated": datetime.now().isoformat()
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")

# --- Dashboard Alerts Endpoint ---
@router.get("/shop/{shop_id}/alerts")
async def get_dashboard_alerts(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get important alerts for the dashboard.
    """
    try:
        if current_user.role not in ['superadmin', 'owner'] and current_user.shop_id != shop_id:
            raise HTTPException(status_code=403, detail="Access denied")

        alerts = []

        overdue_transactions = db.query(Transaction).filter(
            and_(
                Transaction.shop_id == shop_id,
                Transaction.completion_status == 'incomplete',
                Transaction.created_at < datetime.now() - timedelta(days=7)
            )
        ).count()

        if overdue_transactions > 0:
            alerts.append({
                "type": "warning",
                "title": "Overdue Transactions",
                "message": f"{overdue_transactions} transactions are overdue for completion",
                "action": "Review pending transactions"
            })

        high_credit_users = db.query(User).filter(
            and_(
                User.shop_id == shop_id,
                User.role.in_(['farmer', 'buyer']),
                User.current_balance < (User.credit_limit * 0.1)
            )
        ).count()

        if high_credit_users > 0:
            alerts.append({
                "type": "info",
                "title": "Credit Limits",
                "message": f"{high_credit_users} users are near their credit limit",
                "action": "Review credit limits"
            })

        return {
            "success": True,
            "data": alerts
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")

@router.get("/health", response_model=APIResponse, summary="Get system health")
async def get_system_health(db: Session = Depends(get_db)):
    """Get system health information"""
    try:
        db_healthy = True
        try:
            db.execute("SELECT 1")
        except:
            db_healthy = False
        recent_users = db.query(func.count(User.id)).filter(User.created_at >= datetime.now() - timedelta(days=7)).scalar() or 0
        recent_transactions = db.query(func.count(Transaction.id)).filter(Transaction.created_at >= datetime.now() - timedelta(days=1)).scalar() or 0
        health_data = {
            "database_healthy": db_healthy,
            "api_status": "operational",
            "recent_users_7_days": recent_users,
            "recent_transactions_24h": recent_transactions,
            "timestamp": datetime.now().isoformat()
        }
        return APIResponse(success=True, message="System health retrieved successfully", data=health_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")

@router.get("/owner", response_model=APIResponse, summary="Owner dashboard", description="Get owner dashboard data")
def owner_dashboard(db: Session = Depends(get_db)):
    # Dummy data, replace with real analytics
    data = {
        "total_shops": 3,
        "total_users": 25,
        "total_transactions": 120,
        "commission_earned": 5000.0,
        "alerts": ["Low stock on Carrot", "Pending payment from Buyer #12"]
    }
    return APIResponse(success=True, message="Owner dashboard data", data=data)

@router.get("/farmer", response_model=APIResponse, summary="Farmer dashboard", description="Get farmer dashboard data")
def farmer_dashboard(db: Session = Depends(get_db)):
    data = {
        "total_stock": 1500,
        "total_sales": 45,
        "pending_payments": 3,
        "alerts": ["New order for Rose", "Payment pending for Sale #22"]
    }
    return APIResponse(success=True, message="Farmer dashboard data", data=data)

@router.get("/buyer", response_model=APIResponse, summary="Buyer dashboard", description="Get buyer dashboard data")
def buyer_dashboard(db: Session = Depends(get_db)):
    data = {
        "total_purchases": 60,
        "outstanding_credits": 1200.0,
        "recent_orders": 5,
        "alerts": ["Credit limit reached", "New products available"]
    }
    return APIResponse(success=True, message="Buyer dashboard data", data=data)

@router.get("/employee", response_model=APIResponse, summary="Employee dashboard", description="Get employee dashboard data")
def employee_dashboard(db: Session = Depends(get_db)):
    data = {
        "assigned_tasks": 8,
        "stock_checks": 12,
        "transactions_processed": 30,
        "alerts": ["Stock adjustment needed", "Task overdue"]
    }
    return APIResponse(success=True, message="Employee dashboard data", data=data)
