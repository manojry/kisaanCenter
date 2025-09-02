"""
Super Admin API Endpoints

Advanced super admin controls including:
- Shop-specific plan customizations
- Account management (enable/disable)
- Bulk operations
- Business protection and analytics

Related Documentation:
- Super Admin Controls: /Documents/Features/Super_Admin_Enhanced_Controls.md
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field

from ..database import get_db
from ..services.superadmin_service import SuperAdminControlService, ShopAnalyticsService
from ..services.superadmin_service import BusinessError, ComplianceError, ResourceError
from ..schemas import APIResponse, ShopCreateRequest, UserCreateRequest, ProductAssignRequest

router = APIRouter(prefix="/admin", tags=["super-admin"])

# Request/Response Models

class PlanOverrideRequest(BaseModel):
    overrides: Dict[str, Any] = Field(..., description="Feature overrides to apply")
    reason: str = Field(..., min_length=1, max_length=500)
    valid_until: Optional[date] = None

class ShopStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(active|suspended|inactive)$")
    reason: Optional[str] = None
    cascade_to_users: bool = True
    effective_immediately: bool = True

class PasswordResetRequest(BaseModel):
    require_immediate_change: bool = True
    send_notification: bool = True

class BulkChangesRequest(BaseModel):
    shop_ids: List[int] = Field(..., min_items=1)
    changes: Dict[str, Any] = Field(..., min_items=1)
    reason: str = Field(..., min_length=1, max_length=500)

class OverrideResponse(BaseModel):
    shop_id: int
    overrides_applied: Dict[str, Any]
    updated_controls: int
    impact_analysis: Dict[str, Any]
    approval_required: bool
    approval_reason: Optional[str] = None
    valid_until: Optional[date] = None

class ShopStatusResponse(BaseModel):
    shop_id: int
    old_status: str
    new_status: str
    users_affected: int
    cascade_applied: bool
    effective_immediately: bool
    reason: str

class PasswordResetResponse(BaseModel):
    user_id: int
    username: str
    temporary_password: str
    require_immediate_change: bool
    notification_sent: bool

# Shop-Specific Plan Customization Endpoints

@router.put("/shops/{shop_id}/plan-overrides", response_model=OverrideResponse)
def create_shop_plan_override(
    shop_id: int,
    override_request: PlanOverrideRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Create shop-specific plan overrides with business protection"""
    
    service = SuperAdminControlService(db)
    
    try:
        result = service.create_shop_plan_override(
            shop_id=shop_id,
            admin_id=admin_id,
            overrides=override_request.overrides,
            reason=override_request.reason,
            valid_until=override_request.valid_until
        )
        return result
    
    except (BusinessError, ComplianceError, ResourceError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/shops/{shop_id}/overrides")
def get_shop_overrides(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get all active overrides for a shop"""
    
    service = SuperAdminControlService(db)
    
    try:
        return service.get_shop_overrides_summary(shop_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/shops/{shop_id}/overrides/{feature_name}")
def remove_shop_override(
    shop_id: int,
    feature_name: str,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Remove a specific override for a shop"""
    
    from ..services.subscription_service import FeatureControlService
    service = FeatureControlService(db)
    
    try:
        # Reset to plan default by removing admin control
        service.update_feature_control(
            shop_id=shop_id,
            feature_name=feature_name,
            admin_id=None,  # Remove admin control
            reason="Override removed by admin"
        )
        return {"message": f"Override for {feature_name} removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Shop Management Endpoints (Superadmin only)

@router.post("/shops", response_model=APIResponse)
def create_shop(
    shop_data: ShopCreateRequest,
    db: Session = Depends(get_db)
):
    """Superadmin creates a new shop"""
    from ..services.shop_service import ShopService
    result = ShopService(db).create_shop(shop_data)
    return result

@router.post("/shops/{shop_id}/users", response_model=APIResponse)
def add_users_to_shop(
    shop_id: int,
    users_data: list[UserCreateRequest],
    db: Session = Depends(get_db)
):
    """Superadmin adds users to shop"""
    from ..services.user_service import UserService
    result = UserService(db).add_users_to_shop(shop_id, users_data)
    return result

@router.post("/shops/{shop_id}/products", response_model=APIResponse)
def assign_products_to_shop(
    shop_id: int,
    product_data: ProductAssignRequest,
    db: Session = Depends(get_db)
):
    """Superadmin assigns products to shop"""
    from ..services.product_service import ProductService
    result = ProductService(db).assign_products_to_shop(shop_id, product_data)
    return result

@router.post("/shops/{shop_id}/activate", response_model=APIResponse)
def activate_shop(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Superadmin activates a shop"""
    from ..services.shop_service import ShopService
    result = ShopService(db).activate_shop(shop_id)
    return result

# Account Management Endpoints

@router.put("/shops/{shop_id}/status", response_model=ShopStatusResponse)
def manage_shop_status(
    shop_id: int,
    status_request: ShopStatusRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Enable/disable shop and optionally all its users"""
    
    service = SuperAdminControlService(db)
    
    try:
        result = service.manage_shop_status(
            shop_id=shop_id,
            admin_id=admin_id,
            status=status_request.status,
            reason=status_request.reason,
            cascade_to_users=status_request.cascade_to_users,
            effective_immediately=status_request.effective_immediately
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/users/{user_id}/force-password-reset", response_model=PasswordResetResponse)
def force_password_reset(
    user_id: int,
    reset_request: PasswordResetRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Force password reset for a user"""
    
    service = SuperAdminControlService(db)
    
    try:
        result = service.force_password_reset(
            user_id=user_id,
            admin_id=admin_id,
            require_immediate_change=reset_request.require_immediate_change,
            send_notification=reset_request.send_notification
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Plan Assignment Endpoints

@router.put("/shops/{shop_id}/plan", response_model=APIResponse)
def assign_plan_to_shop(
    shop_id: int,
    plan_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Superadmin assigns a plan to a shop"""
    try:
        # Update shop with new plan
        result = db.execute(text("""
            UPDATE shops SET plan_id = :plan_id 
            WHERE id = :shop_id
            RETURNING id, name, plan_id
        """), {"plan_id": plan_id, "shop_id": shop_id})
        
        shop = result.fetchone()
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")
            
        return APIResponse(
            success=True,
            message=f"Plan {plan_id} assigned to shop {shop_id}",
            data={"shop_id": shop_id, "plan_id": plan_id, "reason": reason}
        )
    except Exception as e:
        return APIResponse(success=False, message=f"Error assigning plan: {str(e)}")

@router.put("/users/{owner_id}/plan", response_model=APIResponse) 
def assign_plan_to_owner(
    owner_id: int,
    plan_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Superadmin assigns a plan to an owner (affects their shop)"""
    try:
        # First verify the user is an owner
        user_result = db.execute(text("""
            SELECT id, role, shop_id FROM users WHERE id = :owner_id AND role = 'owner'
        """), {"owner_id": owner_id})
        
        owner = user_result.fetchone()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        
        # Update the owner's shop plan
        if owner[2]:  # shop_id exists
            shop_result = db.execute(text("""
                UPDATE shops SET plan_id = :plan_id 
                WHERE id = :shop_id
                RETURNING id, name
            """), {"plan_id": plan_id, "shop_id": owner[2]})
            
            shop = shop_result.fetchone()
            if shop:
                return APIResponse(
                    success=True,
                    message=f"Plan {plan_id} assigned to owner {owner_id}'s shop",
                    data={"owner_id": owner_id, "shop_id": owner[2], "plan_id": plan_id}
                )
        
        return APIResponse(success=False, message="Owner has no associated shop")
        
    except Exception as e:
        return APIResponse(success=False, message=f"Error assigning plan to owner: {str(e)}")

# Bulk Operations Endpoints

@router.post("/bulk/plan-changes")
def bulk_plan_changes(
    bulk_request: BulkChangesRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Apply plan changes to multiple shops"""
    
    service = SuperAdminControlService(db)
    
    result = service.bulk_plan_changes(
        shop_ids=bulk_request.shop_ids,
        changes=bulk_request.changes,
        admin_id=admin_id,
        reason=bulk_request.reason
    )
    
    return {
        "message": f"Bulk operation completed: {len(result['successful'])} successful, {len(result['failed'])} failed",
        "details": result
    }

@router.post("/bulk/shop-status")
def bulk_shop_status_change(
    shop_ids: List[int],
    status_request: ShopStatusRequest,
    admin_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Change status for multiple shops"""
    
    service = SuperAdminControlService(db)
    results = {
        'successful': [],
        'failed': [],
        'total_shops': len(shop_ids)
    }
    
    for shop_id in shop_ids:
        try:
            result = service.manage_shop_status(
                shop_id=shop_id,
                admin_id=admin_id,
                status=status_request.status,
                reason=f"Bulk operation: {status_request.reason}",
                cascade_to_users=status_request.cascade_to_users,
                effective_immediately=status_request.effective_immediately
            )
            results['successful'].append({'shop_id': shop_id, 'result': result})
        except Exception as e:
            results['failed'].append({'shop_id': shop_id, 'error': str(e)})
    
    return {
        "message": f"Bulk status change completed: {len(results['successful'])} successful, {len(results['failed'])} failed",
        "details": results
    }

# Analytics & Monitoring Endpoints

@router.get("/shops/{shop_id}/analytics")
def get_shop_analytics(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive shop analytics"""
    
    service = ShopAnalyticsService(db)
    
    try:
        return service.get_shop_performance_metrics(shop_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/analytics/risk-assessment")
def get_risk_assessment(
    db: Session = Depends(get_db)
):
    """Get system-wide risk assessment"""
    
    from ..models import Shop, Subscription, SubscriptionStatus
    
    # Get shops with payment issues
    payment_risk_shops = db.query(Shop).join(Subscription).filter(
        Subscription.payment_status.in_(['overdue', 'failed']),
        Subscription.status == SubscriptionStatus.ACTIVE
    ).all()
    
    # Get suspended shops
    suspended_shops = db.query(Shop).filter(
        Shop.status == 'suspended'
    ).count()
    
    # Get shops with custom overrides
    shops_with_overrides = db.query(Shop).join(
        "feature_controls"
    ).filter(
        "feature_controls.controlled_by IS NOT NULL"
    ).distinct().count()
    
    return {
        "payment_risk": {
            "count": len(payment_risk_shops),
            "shops": [{"id": s.id, "name": s.name} for s in payment_risk_shops]
        },
        "suspended_shops": suspended_shops,
        "shops_with_custom_overrides": shops_with_overrides,
        "total_active_shops": db.query(Shop).filter(Shop.status == 'active').count()
    }

@router.get("/analytics/revenue-impact")
def get_revenue_impact_analysis(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Analyze revenue impact of admin overrides"""
    
    from ..models import SubscriptionHistory
    
    # Get subscription changes in the last N days
    cutoff_date = date.today() - timedelta(days=days)
    
    recent_changes = db.query(SubscriptionHistory).filter(
        SubscriptionHistory.effective_date >= cutoff_date,
        SubscriptionHistory.change_reason.like('%override%')
    ).all()
    
    total_changes = len(recent_changes)
    # In production, calculate actual revenue impact
    estimated_impact = 0  # Would calculate based on price changes
    
    return {
        "period_days": days,
        "total_override_changes": total_changes,
        "estimated_revenue_impact": estimated_impact,
        "recent_changes": [
            {
                "shop_id": change.shop_id,
                "change_reason": change.change_reason,
                "effective_date": change.effective_date,
                "changed_by": change.changed_by
            }
            for change in recent_changes
        ]
    }

# Business Protection Endpoints

@router.get("/protection/validate-overrides")
def validate_override_proposal(
    shop_id: int,
    proposed_overrides: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Validate proposed overrides without applying them"""
    
    service = SuperAdminControlService(db)
    
    try:
        # Use internal validation method
        service._validate_overrides(shop_id, proposed_overrides)
        impact = service._analyze_change_impact(shop_id, proposed_overrides)
        approval_required, approval_reason = service._requires_approval(proposed_overrides)
        
        return {
            "valid": True,
            "impact_analysis": impact,
            "approval_required": approval_required,
            "approval_reason": approval_reason,
            "warnings": []
        }
    
    except (BusinessError, ComplianceError, ResourceError) as e:
        return {
            "valid": False,
            "error": str(e),
            "error_type": e.__class__.__name__
        }

@router.get("/protection/business-rules")
def get_business_protection_rules():
    """Get current business protection rules and limits"""
    
    from ..services.superadmin_service import (
        MIN_MONTHLY_PRICE, MAX_DISCOUNT_YEARLY, MAX_DISCOUNT_QUARTERLY,
        MAX_DATA_RETENTION_MONTHS, RESOURCE_LIMITS, HIGH_RISK_THRESHOLDS
    )
    
    return {
        "pricing_protection": {
            "min_monthly_price": float(MIN_MONTHLY_PRICE),
            "max_discount_yearly": MAX_DISCOUNT_YEARLY,
            "max_discount_quarterly": MAX_DISCOUNT_QUARTERLY
        },
        "compliance_protection": {
            "max_data_retention_months": MAX_DATA_RETENTION_MONTHS
        },
        "resource_limits": RESOURCE_LIMITS,
        "approval_thresholds": HIGH_RISK_THRESHOLDS
    }

# System Health for Super Admin

@router.get("/health")
def super_admin_health_check(db: Session = Depends(get_db)):
    """Health check for super admin functionality"""
    
    try:
        from ..models import Shop, User, Subscription, FeatureControl
        
        # Count key entities
        total_shops = db.query(Shop).count()
        active_shops = db.query(Shop).filter(Shop.status == 'active').count()
        total_users = db.query(User).count()
        active_subscriptions = db.query(Subscription).filter(
            Subscription.status == 'active'
        ).count()
        custom_controls = db.query(FeatureControl).filter(
            FeatureControl.controlled_by.isnot(None)
        ).count()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "system_metrics": {
                "total_shops": total_shops,
                "active_shops": active_shops,
                "total_users": total_users,
                "active_subscriptions": active_subscriptions,
                "custom_feature_controls": custom_controls
            },
            "protection_systems": {
                "business_rules": "active",
                "compliance_checks": "active",
                "approval_workflows": "active"
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Super admin service unhealthy: {str(e)}"
        )

@router.post("/categories/{category_id}/shops", response_model=APIResponse)
def assign_category_to_shops(
    category_id: int,
    shop_ids: List[int],
    db: Session = Depends(get_db)
):
    """Assign a category to multiple shops"""
    try:
        # Validate category exists
        category_check = db.execute(text("""
            SELECT name FROM categories WHERE id = :category_id AND record_status = 'active'
        """), {"category_id": category_id}).fetchone()
        
        if not category_check:
            return APIResponse(success=False, message=f"Category {category_id} not found")
        
        assigned_count = 0
        for shop_id in shop_ids:
            # Check if shop exists
            shop_check = db.execute(text("""
                SELECT name FROM shops WHERE id = :shop_id AND record_status = 'active'
            """), {"shop_id": shop_id}).fetchone()
            
            if shop_check:
                # Check if assignment already exists
                existing = db.execute(text("""
                    SELECT id FROM shop_categories 
                    WHERE shop_id = :shop_id AND category_id = :category_id
                """), {"shop_id": shop_id, "category_id": category_id}).fetchone()
                
                if not existing:
                    db.execute(text("""
                        INSERT INTO shop_categories (shop_id, category_id, is_active)
                        VALUES (:shop_id, :category_id, true)
                    """), {"shop_id": shop_id, "category_id": category_id})
                    assigned_count += 1
                else:
                    # Activate if inactive
                    db.execute(text("""
                        UPDATE shop_categories SET is_active = true
                        WHERE shop_id = :shop_id AND category_id = :category_id
                    """), {"shop_id": shop_id, "category_id": category_id})
                    assigned_count += 1
        
        db.commit()
        return APIResponse(
            success=True,
            message=f"Category '{category_check[0]}' assigned to {assigned_count} shops",
            data={"category_id": category_id, "assigned_shops": assigned_count}
        )
        
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Error assigning category: {str(e)}")

@router.get("/shops/{shop_id}/categories", response_model=APIResponse)
def get_shop_categories(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get categories assigned to a shop"""
    try:
        result = db.execute(text("""
            SELECT c.id, c.name, c.description, sc.is_active
            FROM categories c
            JOIN shop_categories sc ON c.id = sc.category_id
            WHERE sc.shop_id = :shop_id AND sc.is_active = true
            ORDER BY c.name
        """), {"shop_id": shop_id})
        
        categories = [
            {
                "id": row[0],
                "name": row[1], 
                "description": row[2],
                "is_active": row[3]
            }
            for row in result.fetchall()
        ]
        
        return APIResponse(
            success=True,
            message=f"Categories for shop {shop_id} retrieved",
            data=categories
        )
    except Exception as e:
        return APIResponse(success=False, message=f"Error retrieving shop categories: {str(e)}")

@router.delete("/shops/{shop_id}/categories/{category_id}", response_model=APIResponse)
def remove_category_from_shop(
    shop_id: int,
    category_id: int,
    db: Session = Depends(get_db)
):
    """Remove category assignment from shop"""
    try:
        result = db.execute(text("""
            UPDATE shop_categories 
            SET is_active = false
            WHERE shop_id = :shop_id AND category_id = :category_id
            RETURNING id
        """), {"shop_id": shop_id, "category_id": category_id})
        
        if result.fetchone():
            db.commit()
            return APIResponse(
                success=True,
                message=f"Category {category_id} removed from shop {shop_id}"
            )
        else:
            return APIResponse(
                success=False,
                message="Category assignment not found or already inactive"
            )
    except Exception as e:
        db.rollback()
        return APIResponse(success=False, message=f"Error removing category: {str(e)}")
