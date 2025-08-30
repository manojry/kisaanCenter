"""
Subscription API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
import logging
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

def success_response(message: str, data: Any = None) -> Dict:
    """Standard success response format"""
    return {
        "success": True,
        "message": message,
        "data": data
    }

@router.get("/plans")
def get_all_plans(db: Session = Depends(get_db)):
    """Get all subscription plans"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, monthly_price, quarterly_price, yearly_price,
                   max_farmers, max_buyers, max_transactions, features, status
            FROM plans
            WHERE status = 'active'
            ORDER BY monthly_price ASC
        """))
        
        plans = []
        for plan in result.fetchall():
            plans.append({
                "id": plan.id,
                "name": plan.name,
                "description": plan.description,
                "monthly_price": float(plan.monthly_price),
                "quarterly_price": float(plan.quarterly_price) if plan.quarterly_price else None,
                "yearly_price": float(plan.yearly_price) if plan.yearly_price else None,
                "max_farmers": plan.max_farmers,
                "max_buyers": plan.max_buyers,
                "max_transactions": plan.max_transactions,
                "features": plan.features,
                "status": plan.status
            })
        
        return {
            "success": True,
            "message": "Subscription plans retrieved successfully",
            "data": plans
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve subscription plans")

@router.get("/shop/{shop_id}")
def get_shop_subscription(shop_id: int, db: Session = Depends(get_db)):
    """Get subscription for a shop"""
    try:
        result = db.execute(text("""
            SELECT s.id, s.shop_id, s.plan_id, s.billing_cycle, s.status,
                   s.start_date, s.end_date, s.amount,
                   p.name as plan_name
            FROM subscriptions s
            LEFT JOIN plans p ON s.plan_id = p.id
            WHERE s.shop_id = :shop_id
            ORDER BY s.created_at DESC
            LIMIT 1
        """), {"shop_id": shop_id})
        
        subscription = result.fetchone()
        if not subscription:
            raise HTTPException(status_code=404, detail="No subscription found for this shop")
        
        return success_response("Shop subscription found", {
            "id": subscription.id,
            "shop_id": subscription.shop_id,
            "plan_id": subscription.plan_id,
            "plan_name": subscription.plan_name,
            "billing_cycle": subscription.billing_cycle,
            "status": subscription.status,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
            "amount": float(subscription.amount) if subscription.amount else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shop subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shop subscription")

@router.get("/shop/{shop_id}/limits/farmers")
def check_farmer_creation_limit(shop_id: int, db: Session = Depends(get_db)):
    """Check farmer creation limits for a shop"""
    try:
        # Get shop's plan limits
        result = db.execute(text("""
            SELECT p.max_farmers
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.shop_id = :shop_id AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        """), {"shop_id": shop_id})
        
        plan = result.fetchone()
        max_farmers = plan.max_farmers if plan else 100  # Default limit
        
        # Get current farmer count
        result = db.execute(text("""
            SELECT COUNT(*) as farmer_count
            FROM users
            WHERE shop_id = :shop_id AND role = 'farmer' AND status = 'active'
        """), {"shop_id": shop_id})
        
        current_count = result.fetchone().farmer_count
        
        return {
            "feature": "farmer_creation",
            "status": "ok",
            "data": {
                "limit": max_farmers,
                "usage": current_count,
                "remaining": max_farmers - current_count,
                "can_create": current_count < max_farmers
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking farmer creation limit: {e}")
        raise HTTPException(status_code=500, detail="Failed to check farmer creation limit")

@router.get("/health")
def subscription_health_check(db: Session = Depends(get_db)):
    """Subscription service health check"""
    try:
        # Check if we can query plans and subscriptions
        plans_result = db.execute(text("SELECT COUNT(*) as count FROM plans"))
        plans_count = plans_result.fetchone().count
        
        subscriptions_result = db.execute(text("SELECT COUNT(*) as count FROM subscriptions"))
        subscriptions_count = subscriptions_result.fetchone().count
        
        return {
            "status": "healthy",
            "timestamp": "2025-08-30T18:13:43.162273",
            "metrics": {
                "total_plans": plans_count,
                "total_subscriptions": subscriptions_count
            }
        }
        
    except Exception as e:
        logger.error(f"Subscription health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }