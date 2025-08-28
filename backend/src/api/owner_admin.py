"""
Owner Administrative API

This module provides APIs for shop owners to manage administrative functions,
including shop settings, subscription management, profile management, and activity tracking.

Features:
- Shop settings and configuration management
- Profile management for owner
- Activity tracking and audit logs
- Shop statistics and information
- User management summary functions
- System notifications and alerts
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    Shop, User, Subscription, Plan, AuditLog, Transaction, 
    UserRole, RecordStatus, SubscriptionStatus
)
from ..services.user_service import UserService, get_current_user

router = APIRouter(prefix="/owner/admin", tags=["Owner Administrative"])

# Request Models
class ShopSettingsRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    contact_info: Optional[str] = None
    business_hours: Optional[str] = None
    description: Optional[str] = None

class OwnerProfileRequest(BaseModel):
    username: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None

# Shop Management

@router.get("/shop/info", summary="Get shop information and settings")
async def get_shop_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive shop information and current settings"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    if not current_user.shop_id:
        raise HTTPException(status_code=400, detail="User not associated with any shop")
    
    # Get shop details
    shop = db.query(Shop).filter(Shop.id == current_user.shop_id).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get current subscription
    current_subscription = db.query(Subscription).filter(
        Subscription.shop_id == current_user.shop_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    # Get current plan
    current_plan = None
    if current_subscription:
        current_plan = db.query(Plan).filter(
            Plan.id == current_subscription.plan_id
        ).first()
    
    # Get user counts
    from sqlalchemy import func
    user_counts = db.query(
        User.role,
        func.count(User.id).label('count')
    ).filter(
        User.shop_id == current_user.shop_id,
        User.status == RecordStatus.ACTIVE
    ).group_by(User.role).all()
    
    user_stats = {role.value: 0 for role in UserRole}
    for uc in user_counts:
        user_stats[uc.role.value] = uc.count
    
    return {
        "shop": {
            "id": shop.id,
            "name": shop.name,
            "location": shop.location,
            "status": shop.status,
            "created_at": shop.created_at,
            "updated_at": shop.updated_at
        },
        "subscription": {
            "id": current_subscription.id if current_subscription else None,
            "status": current_subscription.status if current_subscription else None,
            "start_date": current_subscription.start_date if current_subscription else None,
            "end_date": current_subscription.end_date if current_subscription else None,
            "billing_cycle": current_subscription.billing_cycle if current_subscription else None,
            "auto_renew": current_subscription.auto_renew if current_subscription else None
        },
        "plan": {
            "id": current_plan.id if current_plan else None,
            "name": current_plan.name if current_plan else None,
            "max_farmers": current_plan.max_farmers if current_plan else None,
            "max_buyers": current_plan.max_buyers if current_plan else None,
            "max_transactions": current_plan.max_transactions if current_plan else None,
            "features": current_plan.features if current_plan else None
        },
        "user_statistics": user_stats,
        "limits_status": {
            "farmers": {
                "current": user_stats.get("farmer", 0),
                "limit": current_plan.max_farmers if current_plan else None,
                "percentage": (user_stats.get("farmer", 0) / current_plan.max_farmers * 100) if current_plan and current_plan.max_farmers else 0
            },
            "buyers": {
                "current": user_stats.get("buyer", 0),
                "limit": current_plan.max_buyers if current_plan else None,
                "percentage": (user_stats.get("buyer", 0) / current_plan.max_buyers * 100) if current_plan and current_plan.max_buyers else 0
            }
        }
    }

@router.put("/shop/settings", summary="Update shop settings")
async def update_shop_settings(
    request: ShopSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update shop settings and configuration"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    if not current_user.shop_id:
        raise HTTPException(status_code=400, detail="User not associated with any shop")
    
    shop = db.query(Shop).filter(Shop.id == current_user.shop_id).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Update shop fields
    if request.name is not None:
        shop.name = request.name
    if request.location is not None:
        shop.location = request.location
    
    shop.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(shop)
    
    return {
        "id": shop.id,
        "name": shop.name,
        "location": shop.location,
        "updated_at": shop.updated_at
    }

# Profile Management

@router.get("/profile", summary="Get owner profile information")
async def get_owner_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get owner profile information"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "contact": current_user.contact,
        "shop_id": current_user.shop_id,
        "status": current_user.status,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.put("/profile", summary="Update owner profile")
async def update_owner_profile(
    request: OwnerProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update owner profile information"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Update profile fields
    if request.username is not None:
        # Check if username is already taken
        existing_user = db.query(User).filter(
            User.username == request.username,
            User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        current_user.username = request.username
    
    if request.contact is not None:
        current_user.contact = request.contact
    
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "contact": current_user.contact,
        "updated_at": current_user.updated_at
    }

# Activity Tracking

@router.get("/activity", summary="Get recent activity and audit logs")
async def get_recent_activity(
    days: int = Query(7, ge=1, le=30),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity and audit logs for the shop"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get audit logs for the shop
    query = db.query(AuditLog).filter(
        AuditLog.shop_id == current_user.shop_id,
        AuditLog.created_at >= start_date,
        AuditLog.created_at <= end_date
    )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    audit_logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "period": {
            "start_date": start_date.date(),
            "end_date": end_date.date(),
            "days": days
        },
        "activity": [
            {
                "id": log.id,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "user_id": log.user_id,
                "action": log.action,
                "old_data": log.old_data,
                "new_data": log.new_data,
                "created_at": log.created_at
            } for log in audit_logs
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/activity/summary", summary="Get activity summary")
async def get_activity_summary(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity summary and statistics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Activity counts by action
    action_counts = db.query(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.shop_id == current_user.shop_id,
        AuditLog.created_at >= start_date,
        AuditLog.created_at <= end_date
    ).group_by(AuditLog.action).all()
    
    # Activity counts by entity type
    entity_counts = db.query(
        AuditLog.entity_type,
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.shop_id == current_user.shop_id,
        AuditLog.created_at >= start_date,
        AuditLog.created_at <= end_date
    ).group_by(AuditLog.entity_type).all()
    
    # Most active users
    user_activity = db.query(
        User.username,
        func.count(AuditLog.id).label('activity_count')
    ).join(AuditLog).filter(
        AuditLog.shop_id == current_user.shop_id,
        AuditLog.created_at >= start_date,
        AuditLog.created_at <= end_date
    ).group_by(User.id, User.username).order_by(
        func.count(AuditLog.id).desc()
    ).limit(10).all()
    
    return {
        "period": {
            "start_date": start_date.date(),
            "end_date": end_date.date(),
            "days": days
        },
        "action_summary": [
            {"action": ac.action, "count": ac.count}
            for ac in action_counts
        ],
        "entity_summary": [
            {"entity_type": ec.entity_type, "count": ec.count}
            for ec in entity_counts
        ],
        "most_active_users": [
            {"username": ua.username, "activity_count": ua.activity_count}
            for ua in user_activity
        ]
    }

# System Statistics

@router.get("/stats/overview", summary="Get system overview statistics")
async def get_system_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive system overview statistics"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    # User statistics
    user_stats = db.query(
        User.role,
        func.count(User.id).label('total'),
        func.count(case([(User.status == RecordStatus.ACTIVE, 1)])).label('active')
    ).filter(
        User.shop_id == current_user.shop_id
    ).group_by(User.role).all()
    
    # Transaction statistics (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    
    transaction_stats = db.query(
        func.count(Transaction.id).label('total_transactions'),
        func.sum(Transaction.buyer_paid_amount).label('total_revenue'),
        func.sum(Transaction.commission_amount).label('total_commission'),
        func.avg(Transaction.buyer_paid_amount).label('avg_transaction_value')
    ).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= thirty_days_ago
    ).first()
    
    # Recent growth metrics
    last_month_start = date.today() - timedelta(days=60)
    last_month_end = date.today() - timedelta(days=30)
    
    last_month_stats = db.query(
        func.count(Transaction.id).label('last_month_transactions'),
        func.sum(Transaction.buyer_paid_amount).label('last_month_revenue')
    ).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.date >= last_month_start,
        Transaction.date < last_month_end
    ).first()
    
    # Calculate growth rates
    transaction_growth = 0
    revenue_growth = 0
    
    if last_month_stats.last_month_transactions and last_month_stats.last_month_transactions > 0:
        transaction_growth = ((transaction_stats.total_transactions - last_month_stats.last_month_transactions) / 
                            last_month_stats.last_month_transactions) * 100
    
    if last_month_stats.last_month_revenue and last_month_stats.last_month_revenue > 0:
        revenue_growth = ((transaction_stats.total_revenue - last_month_stats.last_month_revenue) / 
                        last_month_stats.last_month_revenue) * 100
    
    return {
        "user_statistics": [
            {
                "role": us.role.value,
                "total": us.total,
                "active": us.active,
                "inactive": us.total - us.active
            } for us in user_stats
        ],
        "transaction_statistics": {
            "total_transactions": transaction_stats.total_transactions or 0,
            "total_revenue": float(transaction_stats.total_revenue or 0),
            "total_commission": float(transaction_stats.total_commission or 0),
            "avg_transaction_value": float(transaction_stats.avg_transaction_value or 0)
        },
        "growth_metrics": {
            "transaction_growth": round(transaction_growth, 2),
            "revenue_growth": round(revenue_growth, 2)
        },
        "period": "Last 30 days"
    }

# Notifications and Alerts

@router.get("/alerts", summary="Get system alerts and notifications")
async def get_system_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system alerts and notifications for the owner"""
    
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from sqlalchemy import func
    
    alerts = []
    
    # Check subscription status
    current_subscription = db.query(Subscription).filter(
        Subscription.shop_id == current_user.shop_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if current_subscription:
        # Subscription expiring soon (within 7 days)
        if current_subscription.end_date <= date.today() + timedelta(days=7):
            alerts.append({
                "type": "warning",
                "category": "subscription",
                "message": f"Subscription expires on {current_subscription.end_date}",
                "action_required": True
            })
    else:
        alerts.append({
            "type": "error",
            "category": "subscription",
            "message": "No active subscription found",
            "action_required": True
        })
    
    # Check user limits
    if current_subscription:
        current_plan = db.query(Plan).filter(Plan.id == current_subscription.plan_id).first()
        if current_plan:
            farmer_count = db.query(User).filter(
                User.shop_id == current_user.shop_id,
                User.role == UserRole.FARMER,
                User.status == RecordStatus.ACTIVE
            ).count()
            
            buyer_count = db.query(User).filter(
                User.shop_id == current_user.shop_id,
                User.role == UserRole.BUYER,
                User.status == RecordStatus.ACTIVE
            ).count()
            
            # Check if nearing limits (80% usage)
            if farmer_count >= current_plan.max_farmers * 0.8:
                alerts.append({
                    "type": "warning",
                    "category": "limits",
                    "message": f"Farmer limit nearly reached: {farmer_count}/{current_plan.max_farmers}",
                    "action_required": False
                })
            
            if buyer_count >= current_plan.max_buyers * 0.8:
                alerts.append({
                    "type": "warning",
                    "category": "limits",
                    "message": f"Buyer limit nearly reached: {buyer_count}/{current_plan.max_buyers}",
                    "action_required": False
                })
    
    # Check for pending transactions (older than 7 days)
    week_ago = date.today() - timedelta(days=7)
    pending_transactions = db.query(Transaction).filter(
        Transaction.shop_id == current_user.shop_id,
        Transaction.completion_status != "complete",
        Transaction.date <= week_ago
    ).count()
    
    if pending_transactions > 0:
        alerts.append({
            "type": "info",
            "category": "transactions",
            "message": f"{pending_transactions} transactions pending completion for over 7 days",
            "action_required": False
        })
    
    # Check for low stock items
    low_stock_count = db.query(func.count(func.distinct(FarmerStock.product_id))).filter(
        FarmerStock.shop_id == current_user.shop_id,
        FarmerStock.status == "active"
    ).having(func.sum(FarmerStock.quantity) < 10).scalar() or 0
    
    if low_stock_count > 0:
        alerts.append({
            "type": "warning",
            "category": "inventory",
            "message": f"{low_stock_count} products have low stock levels",
            "action_required": False
        })
    
    return {
        "alerts": alerts,
        "alert_count": len(alerts),
        "critical_count": len([a for a in alerts if a["type"] == "error"]),
        "warning_count": len([a for a in alerts if a["type"] == "warning"]),
        "info_count": len([a for a in alerts if a["type"] == "info"])
    }

# Import case function for SQLAlchemy
from sqlalchemy import case
from ..models import FarmerStock