
"""
Subscription Management API Endpoints

This module provides REST API endpoints for subscription management including:
- Plan management
- Subscription lifecycle (create, upgrade, renew)
- Feature control and restrictions
- Usage tracking and analytics

Related Documentation:
- Subscription Plan: /Documents/Features/Subscription_Management_Plan.md
- API Documentation: /docs/API_DOCUMENTATION.md
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import date, datetime

from src.db.connection import get_db
from src.models import Plan, Subscription, FeatureControl
from src.models.enums import BillingCycle, SubscriptionStatus, UserRole
from src.services.subscription_service import SubscriptionService
from src.services.feature_control_service import FeatureControlService
from src.services.usage_tracking_service import UsageTrackingService
from src.services.billing_service import BillingService
from src.schemas.subscription_schemas import (
    SubscriptionResponse, PlanResponse, FeatureControlResponse,
    CreateSubscriptionRequest, UpgradeSubscriptionRequest, 
    UpdateFeatureControlRequest, PlanCreate
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Plan Management Endpoints

@router.get("/plans", response_model=List[PlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    plans = db.query(Plan).filter(Plan.status == 'active').all()
    
    # Calculate pricing for different billing cycles
    for plan in plans:
        plan.quarterly_price = plan.monthly_price * 3 * 0.95  # 5% discount
        plan.yearly_price = plan.monthly_price * 12 * 0.85    # 15% discount
    
    return plans

@router.post("/plans", response_model=PlanResponse)
def create_plan(
    plan_data: PlanCreate,
    db: Session = Depends(get_db)
):
    """Create a new subscription plan (Super Admin only)"""
    
    plan = Plan(
        name=plan_data.name,
        description=plan_data.description,
        monthly_price=plan_data.monthly_price,
        quarterly_price=plan_data.monthly_price * 3 * 0.95,
        yearly_price=plan_data.monthly_price * 12 * 0.85,
        max_farmers=plan_data.max_farmers,
        max_buyers=plan_data.max_buyers,
        max_transactions=plan_data.max_transactions,
        data_retention_months=plan_data.data_retention_months,
        features=plan_data.features or {}
    )
    
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan

@router.get("/plans/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get specific plan details"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate pricing for different billing cycles
    plan.quarterly_price = plan.monthly_price * 3 * 0.95  # 5% discount
    plan.yearly_price = plan.monthly_price * 12 * 0.85    # 15% discount
    
    return plan

# Subscription Management Endpoints

@router.post("/", response_model=SubscriptionResponse)
def create_subscription(
    subscription_data: CreateSubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Create a new subscription for a shop"""
    
    service = SubscriptionService(db)
    
    try:
        subscription = service.create_subscription(
            shop_id=subscription_data.shop_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            start_date=subscription_data.start_date
        )
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/shop/{shop_id}", response_model=SubscriptionResponse)
def get_shop_subscription(shop_id: int, db: Session = Depends(get_db)):
    """Get active subscription for a shop"""
    
    service = SubscriptionService(db)
    subscription = service.get_active_subscription(shop_id)
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    return subscription

@router.put("/shop/{shop_id}/upgrade")
def upgrade_subscription(
    shop_id: int,
    upgrade_data: UpgradeSubscriptionRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Upgrade subscription to a new plan"""
    
    service = SubscriptionService(db)
    
    try:
        subscription = service.upgrade_subscription(
            shop_id=shop_id,
            new_plan_id=upgrade_data.new_plan_id,
            admin_id=admin_id,
            reason=upgrade_data.reason
        )
        return {"message": "Subscription upgraded successfully", "subscription": subscription}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/shop/{shop_id}/renew")
def renew_subscription(shop_id: int, db: Session = Depends(get_db)):
    """Manually renew subscription"""
    
    service = SubscriptionService(db)
    subscription = service.get_active_subscription(shop_id)
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    billing_service = BillingService(db)
    renewed_subscription = billing_service.process_renewal(subscription.id)
    
    return {"message": "Subscription renewed successfully", "subscription": renewed_subscription}

# Feature Control Endpoints

@router.get("/shop/{shop_id}/feature-controls", response_model=List[FeatureControlResponse])
def get_shop_feature_controls(shop_id: int, db: Session = Depends(get_db)):
    """Get all feature controls for a shop"""
    
    controls = db.query(FeatureControl).filter(
        FeatureControl.shop_id == shop_id
    ).all()
    
    return controls

@router.put("/shop/{shop_id}/feature-controls")
def update_feature_control(
    shop_id: int,
    control_data: UpdateFeatureControlRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Update feature control settings"""
    
    service = FeatureControlService(db)
    
    try:
        control = service.update_feature_control(
            shop_id=shop_id,
            feature_name=control_data.feature_name,
            is_enabled=control_data.is_enabled,
            limit_value=control_data.limit_value,
            admin_id=admin_id,
            reason=control_data.reason
        )
        return {"message": "Feature control updated", "control": control}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/shop/{shop_id}/limits/farmers")
def check_farmer_creation_limit(shop_id: int, db: Session = Depends(get_db)):
    """Check farmer creation limits for a shop"""
    
    service = FeatureControlService(db)
    result = service.check_farmer_creation_limit(shop_id)
    
    return {
        "feature": "farmer_creation",
        "status": service.get_restriction_level(result.get('usage_percentage', 0)),
        "data": result
    }

@router.get("/shop/{shop_id}/limits/buyers")
def check_buyer_creation_limit(shop_id: int, db: Session = Depends(get_db)):
    """Check buyer creation limits for a shop"""
    
    service = FeatureControlService(db)
    result = service.check_buyer_creation_limit(shop_id)
    
    return {
        "feature": "buyer_creation",
        "status": service.get_restriction_level(result.get('usage_percentage', 0)),
        **result
    }

@router.get("/shop/{shop_id}/limits/transactions")
def check_transaction_limit(shop_id: int, db: Session = Depends(get_db)):
    """Check transaction limits for a shop"""
    
    service = FeatureControlService(db)
    result = service.check_transaction_limit(shop_id)
    
    return {
        "feature": "monthly_transactions",
        "status": service.get_restriction_level(result.get('usage_percentage', 0)),
        **result
    }

@router.get("/shop/{shop_id}/data-access")
def get_data_access_range(shop_id: int, db: Session = Depends(get_db)):
    """Get accessible data range for a shop"""
    
    service = FeatureControlService(db)
    result = service.get_data_access_range(shop_id)
    
    return {
        "feature": "data_retention",
        **result
    }

# Usage Tracking & Analytics Endpoints

@router.get("/shop/{shop_id}/usage")
def get_usage_summary(
    shop_id: int, 
    days: int = 30, 
    db: Session = Depends(get_db)
):
    """Get usage summary for a shop"""
    
    service = UsageTrackingService(db)
    summary = service.get_usage_summary(shop_id, days)
    
    return {
        "shop_id": shop_id,
        "period_days": days,
        "usage_summary": summary
    }

@router.get("/shop/{shop_id}/upgrade-prediction")
def predict_upgrade_need(shop_id: int, db: Session = Depends(get_db)):
    """Predict if shop needs to upgrade based on usage"""
    
    service = UsageTrackingService(db)
    prediction = service.predict_upgrade_need(shop_id)
    
    return {
        "shop_id": shop_id,
        "prediction": prediction
    }

@router.post("/shop/{shop_id}/usage/track")
def track_feature_usage(
    shop_id: int,
    feature_name: str,
    count: int = 1,
    db: Session = Depends(get_db)
):
    """Track usage of a specific feature"""
    
    service = UsageTrackingService(db)
    service.track_usage(shop_id, feature_name, count)
    
    return {"message": "Usage tracked successfully"}

# Admin Analytics Endpoints

@router.get("/admin/analytics/revenue")
def get_revenue_analytics(db: Session = Depends(get_db)):
    """Get revenue analytics for admin dashboard"""
    
    service = BillingService(db)
    analytics = service.calculate_revenue_analytics()
    
    return analytics

@router.get("/admin/analytics/subscriptions")
def get_subscription_analytics(db: Session = Depends(get_db)):
    """Get subscription analytics"""
    
    # Subscription status distribution
    status_counts = db.query(
        Subscription.status, 
        db.func.count(Subscription.id).label('count')
    ).group_by(Subscription.status).all()
    
    # Billing cycle distribution
    cycle_counts = db.query(
        Subscription.billing_cycle,
        db.func.count(Subscription.id).label('count')
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Subscription.billing_cycle).all()
    
    # Plan popularity
    plan_counts = db.query(
        Plan.name,
        db.func.count(Subscription.id).label('count')
    ).join(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Plan.name).all()
    
    return {
        "subscription_status_distribution": [
            {"status": status, "count": count} for status, count in status_counts
        ],
        "billing_cycle_distribution": [
            {"cycle": cycle, "count": count} for cycle, count in cycle_counts
        ],
        "plan_popularity": [
            {"plan": plan, "count": count} for plan, count in plan_counts
        ]
    }

@router.get("/admin/renewals/upcoming")
def get_upcoming_renewals(days: int = 7, db: Session = Depends(get_db)):
    """Get subscriptions that need renewal soon"""
    
    service = BillingService(db)
    renewals = service.get_upcoming_renewals(days)
    
    return {
        "upcoming_renewals_count": len(renewals),
        "days_ahead": days,
        "renewals": [
            {
                "subscription_id": sub.id,
                "shop_id": sub.shop_id,
                "shop_name": sub.shop.name,
                "plan_name": sub.plan.name,
                "end_date": sub.end_date,
                "amount": float(sub.amount),
                "billing_cycle": sub.billing_cycle
            }
            for sub in renewals
        ]
    }

# Health Check Endpoint for Subscription System

@router.get("/health")
def subscription_health_check(db: Session = Depends(get_db)):
    """Health check for subscription system"""
    
    try:
        # Check if we can query plans and subscriptions
        plan_count = db.query(Plan).count()
        subscription_count = db.query(Subscription).count()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "total_plans": plan_count,
                "total_subscriptions": subscription_count
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Subscription service unhealthy: {str(e)}"
        )
