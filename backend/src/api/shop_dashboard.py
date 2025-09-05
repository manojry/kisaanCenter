from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ..database import get_db
from ..schemas import APIResponse
from ..models import User, Product, Transaction, Shop
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/shops", tags=["Shop Dashboard"])

@router.get("/{shop_id}/dashboard", response_model=APIResponse)
def get_shop_dashboard(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard data for shop owner.
    This endpoint provides all the data needed for the owner dashboard frontend.
    """
    try:
        # Get shop info - use simple query
        shop_query = db.execute(text("""
            SELECT id, name, location, commission_rate
            FROM shops 
            WHERE id = :shop_id
        """), {"shop_id": shop_id}).fetchone()
        
        if not shop_query:
            raise HTTPException(status_code=404, detail="Shop not found")
        
        # Get user counts by role - simplified
        user_counts = db.execute(text("""
            SELECT role, COUNT(*) as count 
            FROM users 
            WHERE shop_id = :shop_id
            GROUP BY role
        """), {"shop_id": shop_id}).fetchall()
        
        users_by_role = {}
        total_users = 0
        for row in user_counts:
            users_by_role[row[0]] = row[1] 
            total_users += row[1]
        
        # Get basic counts
        product_count = db.execute(text("""
            SELECT COUNT(*) FROM products 
            WHERE shop_id = :shop_id OR shop_id IS NULL
        """), {"shop_id": shop_id}).scalar() or 0
        
        transaction_count = db.execute(text("""
            SELECT COUNT(*) FROM transactions 
            WHERE shop_id = :shop_id
        """), {"shop_id": shop_id}).scalar() or 0
        
        # Prepare minimal dashboard data
        dashboard_data = {
            "shop_info": {
                "id": shop_query[0],
                "name": shop_query[1] or f"Shop {shop_id}",
                "commission_rate": float(shop_query[3]) if shop_query[3] else 0,
                "location": shop_query[2] or "Not specified"
            },
            "overview": {
                "total_users": total_users,
                "total_products": product_count,
                "total_transactions": transaction_count,
                "pending_credits": 0
            },
            "users_by_role": users_by_role,
            "financial_summary": {
                "total_sales_30d": 0,
                "total_commission_30d": 0,
                "currency": "INR"
            },
            "recent_activity": {
                "transactions": []
            },
            "quick_actions": [
                {
                    "title": "Add New User",
                    "description": "Add farmers, buyers or employees",
                    "action": "create_user"
                },
                {
                    "title": "Create Transaction", 
                    "description": "Record a new sale or purchase",
                    "action": "create_transaction"
                },
                {
                    "title": "Manage Products",
                    "description": "Add or update product catalog",
                    "action": "manage_products"
                },
                {
                    "title": "View Analytics",
                    "description": "Detailed business analytics", 
                    "action": "view_analytics"
                }
            ]
        }
        
        return APIResponse(
            success=True, 
            message="Dashboard data retrieved successfully", 
            data=dashboard_data
        )
        
    except Exception as e:
        return APIResponse(
            success=False, 
            message=f"Error retrieving dashboard data: {str(e)}", 
            data=None
        )
