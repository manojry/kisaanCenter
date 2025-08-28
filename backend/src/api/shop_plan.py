from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import Shop, Subscription, Plan, SubscriptionHistory, User, UserRole, SubscriptionStatus
from ..schemas import APIResponse
from datetime import datetime, date

router = APIRouter(prefix="/shops", tags=["Shop Plan Management"])

@router.post("/{shop_id}/plan", response_model=APIResponse, status_code=status.HTTP_200_OK)
def assign_or_update_plan(
    shop_id: int = Path(..., description="Shop ID to assign/upgrade/downgrade plan"),
    plan_id: int = Query(..., description="Plan ID to assign"),
    billing_cycle: str = Query("monthly", description="Billing cycle: monthly, quarterly, yearly"),
    start_date: Optional[date] = Query(None, description="Subscription start date"),
    end_date: Optional[date] = Query(None, description="Subscription end date"),
    reason: Optional[str] = Query(None, description="Reason for change (upgrade/downgrade)"),
    superadmin_id: Optional[int] = Query(None, description="Superadmin user ID performing the action"),
    db: Session = Depends(get_db)
):
    """
    Assign, upgrade, or downgrade a plan for a shop (owner) by superadmin.
    Creates or updates Subscription and logs change in SubscriptionHistory.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    # End current active subscription
    current_sub = db.query(Subscription).filter(Subscription.shop_id == shop_id, Subscription.status == SubscriptionStatus.ACTIVE).first()
    if current_sub:
        current_sub.status = SubscriptionStatus.EXPIRED
        db.commit()
    # Create new subscription
    new_sub = Subscription(
        shop_id=shop_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        start_date=start_date or datetime.utcnow().date(),
        end_date=end_date or (datetime.utcnow().date()),
        status=SubscriptionStatus.ACTIVE,
        payment_status=plan.status,
        amount=plan.monthly_price,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    # Log in SubscriptionHistory
    sub_hist = SubscriptionHistory(
        subscription_id=new_sub.id,
        shop_id=shop_id,
        previous_plan_id=current_sub.plan_id if current_sub else None,
        new_plan_id=plan_id,
        change_reason=reason,
        changed_by=superadmin_id,
        effective_date=new_sub.start_date,
        created_at=datetime.utcnow()
    )
    db.add(sub_hist)
    db.commit()
    return APIResponse(success=True, message="Plan assigned/updated successfully", data={"subscription_id": new_sub.id, "shop_id": shop_id, "plan_id": plan_id})
