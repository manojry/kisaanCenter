"""
Subscription Management Service

This module handles all subscription-related business logic including:
- Plan management and pricing
- Feature control and limitations
- Usage tracking and billing
- Subscription lifecycle management

Related Documentation:
- Subscription Plan: /Documents/Features/Subscription_Management_Plan.md
- ERD: /Documents/Architecture/ERD.md
- Business Rules: /Documents/Architecture/Business_Rules.md
"""

from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple, Any
from decimal import Decimal
import calendar

from ..database import get_db
from ..models import (
    Plan, Subscription, FeatureControl, UsageTracking, SubscriptionHistory,
    Shop, User, BillingCycle, SubscriptionStatus, PaymentStatus, RecordStatus,
    UserRole, LimitType
)


class SubscriptionService:
    """Core subscription management service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_subscription(
        self, 
        shop_id: int, 
        plan_id: int, 
        billing_cycle: BillingCycle,
        start_date: date = None
    ) -> Subscription:
        """Create a new subscription for a shop"""
        
        if start_date is None:
            start_date = date.today()
            
        plan = self.db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise ValueError(f"Plan {plan_id} not found")
        
        # Calculate pricing based on billing cycle
        amount, discount_amount = self._calculate_subscription_pricing(plan, billing_cycle)
        
        # Calculate end date
        end_date = self._calculate_end_date(start_date, billing_cycle)
        
        subscription = Subscription(
            shop_id=shop_id,
            plan_id=plan_id,
            billing_cycle=billing_cycle,
            start_date=start_date,
            end_date=end_date,
            amount=amount,
            discount_amount=discount_amount,
            status=SubscriptionStatus.ACTIVE,
            payment_status=PaymentStatus.PENDING
        )
        
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        
        # Initialize feature controls based on plan
        self._initialize_feature_controls(shop_id, plan)
        
        return subscription
    
    def upgrade_subscription(self, shop_id: int, new_plan_id: int, changed_by: int = None, reason: str = None) -> Subscription:
        """Upgrade a subscription to a new plan with prorated billing"""
        with self.session() as session:
            # Get current subscription
            subscription = session.query(Subscription).filter(
                Subscription.shop_id == shop_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
            
            if not subscription:
                raise ValueError(f"No active subscription found for shop {shop_id}")
            
            # Get new plan
            new_plan = session.query(Plan).filter(Plan.id == new_plan_id).first()
            if not new_plan or new_plan.status != RecordStatus.ACTIVE.value:
                raise ValueError(f"Plan {new_plan_id} not found or inactive")
            
            # Record subscription history
            subscription_history = SubscriptionHistory(
                subscription_id=subscription.id,
                shop_id=shop_id,
                previous_plan_id=subscription.plan_id,
                new_plan_id=new_plan_id,
                change_reason=reason,
                changed_by=changed_by,
                effective_date=datetime.now().date()
            )
            session.add(subscription_history)
            
            # Calculate prorated amount
            prorated_amount = self._calculate_prorated_amount(
                subscription, new_plan
            )
            
            # Update subscription
            subscription.plan_id = new_plan_id
            subscription.amount = prorated_amount
            subscription.updated_at = datetime.now()
            
            # Update feature controls
            self._sync_feature_controls_from_plan(session, shop_id, new_plan)
            
            session.commit()
            session.refresh(subscription)
            return subscription

    def _calculate_prorated_amount(self, subscription: Subscription, new_plan: Plan) -> float:
        """Calculate prorated amount for subscription upgrade"""
        # Calculate remaining days in current billing cycle
        today = datetime.now().date()
        remaining_days = (subscription.end_date - today).days
        
        # Get total days in billing cycle
        if subscription.billing_cycle == BillingCycle.MONTHLY:
            total_days = 30
            new_amount = new_plan.monthly_price
        elif subscription.billing_cycle == BillingCycle.QUARTERLY:
            total_days = 90
            new_amount = new_plan.quarterly_price
        else:  # YEARLY
            total_days = 365
            new_amount = new_plan.yearly_price
        
        # Calculate prorated amount for remaining period
        if remaining_days <= 0:
            return new_amount
        
        prorated_amount = (new_amount * remaining_days) / total_days
        return round(prorated_amount, 2)
    
    def get_active_subscription(self, shop_id: int) -> Optional[Subscription]:
        """Get the active subscription for a shop"""
        return self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
    
    def _calculate_subscription_pricing(
        self, 
        plan: Plan, 
        billing_cycle: BillingCycle
    ) -> tuple[Decimal, Decimal]:
        """Calculate subscription amount and discount based on billing cycle"""
        
        base_monthly_price = plan.monthly_price
        
        if billing_cycle == BillingCycle.MONTHLY:
            return base_monthly_price, Decimal('0.00')
        
        elif billing_cycle == BillingCycle.QUARTERLY:
            quarterly_total = base_monthly_price * 3
            discount_amount = quarterly_total * Decimal('0.05')  # 5% discount
            return quarterly_total - discount_amount, discount_amount
            
        elif billing_cycle == BillingCycle.YEARLY:
            yearly_total = base_monthly_price * 12
            discount_amount = yearly_total * Decimal('0.15')  # 15% discount
            return yearly_total - discount_amount, discount_amount
            
        else:
            raise ValueError(f"Unsupported billing cycle: {billing_cycle}")
    
    def _calculate_end_date(self, start_date: date, billing_cycle: BillingCycle) -> date:
        """Calculate subscription end date based on billing cycle"""
        
        if billing_cycle == BillingCycle.MONTHLY:
            if start_date.month == 12:
                return start_date.replace(year=start_date.year + 1, month=1)
            else:
                return start_date.replace(month=start_date.month + 1)
        
        elif billing_cycle == BillingCycle.QUARTERLY:
            return start_date + timedelta(days=90)
            
        elif billing_cycle == BillingCycle.YEARLY:
            return start_date.replace(year=start_date.year + 1)
            
        else:
            raise ValueError(f"Unsupported billing cycle: {billing_cycle}")
    
    def _initialize_feature_controls(self, shop_id: int, plan: Plan):
        """Initialize feature controls based on plan limits"""
        
        feature_controls = [
            FeatureControl(
                shop_id=shop_id,
                feature_name='farmer_creation',
                is_enabled=True,
                limit_value=plan.max_farmers,
                limit_type=LimitType.COUNT
            ),
            FeatureControl(
                shop_id=shop_id,
                feature_name='buyer_creation',
                is_enabled=True,
                limit_value=plan.max_buyers,
                limit_type=LimitType.COUNT
            ),
            FeatureControl(
                shop_id=shop_id,
                feature_name='data_retention',
                is_enabled=True,
                limit_value=plan.data_retention_months,
                limit_type=LimitType.MONTHS
            ),
            FeatureControl(
                shop_id=shop_id,
                feature_name='monthly_transactions',
                is_enabled=True,
                limit_value=plan.max_transactions,
                limit_type=LimitType.COUNT
            )
        ]
        
        for control in feature_controls:
            self.db.add(control)
        self.db.commit()


class FeatureControlService:
    """Service for managing feature restrictions and controls"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_farmer_creation_limit(self, shop_id: int) -> Dict[str, Any]:
        """Check if shop can create more farmers"""
        
        feature_control = self._get_feature_control(shop_id, 'farmer_creation')
        if not feature_control or not feature_control.is_enabled:
            return {'can_create': False, 'reason': 'Feature disabled'}
        
        current_farmers = self.db.query(User).filter(
            User.shop_id == shop_id,
            User.role == UserRole.FARMER,
            User.status.in_(['active'])
        ).count()
        
        return {
            'can_create': current_farmers < feature_control.limit_value,
            'current_count': current_farmers,
            'limit': feature_control.limit_value,
            'remaining': max(0, feature_control.limit_value - current_farmers),
            'usage_percentage': (current_farmers / feature_control.limit_value) * 100
        }
    
    def check_buyer_creation_limit(self, shop_id: int) -> Dict[str, Any]:
        """Check if shop can create more buyers"""
        
        feature_control = self._get_feature_control(shop_id, 'buyer_creation')
        if not feature_control or not feature_control.is_enabled:
            return {'can_create': False, 'reason': 'Feature disabled'}
        
        current_buyers = self.db.query(User).filter(
            User.shop_id == shop_id,
            User.role == UserRole.BUYER,
            User.status.in_(['active'])
        ).count()
        
        return {
            'can_create': current_buyers < feature_control.limit_value,
            'current_count': current_buyers,
            'limit': feature_control.limit_value,
            'remaining': max(0, feature_control.limit_value - current_buyers),
            'usage_percentage': (current_buyers / feature_control.limit_value) * 100
        }
    
    def get_data_access_range(self, shop_id: int) -> Dict[str, Any]:
        """Get accessible date range for historical data"""
        
        feature_control = self._get_feature_control(shop_id, 'data_retention')
        if not feature_control:
            return {
                'accessible_from': None,
                'accessible_to': date.today(),
                'is_restricted': False
            }
        
        if feature_control.limit_type == LimitType.MONTHS:
            cutoff_date = date.today() - timedelta(days=feature_control.limit_value * 30)
        else:
            cutoff_date = date.today() - timedelta(days=feature_control.limit_value)
        
        return {
            'accessible_from': cutoff_date,
            'accessible_to': date.today(),
            'retention_months': feature_control.limit_value,
            'is_restricted': True
        }
    
    def check_transaction_limit(self, shop_id: int) -> Dict[str, Any]:
        """Check monthly transaction limit"""
        
        feature_control = self._get_feature_control(shop_id, 'monthly_transactions')
        if not feature_control or not feature_control.is_enabled:
            return {'can_create_transaction': False, 'reason': 'Feature disabled'}
        
        # Get current month transactions
        today = date.today()
        first_day = today.replace(day=1)
        last_day = today.replace(
            day=calendar.monthrange(today.year, today.month)[1]
        )
        
        from ..models import Transaction
        current_month_transactions = self.db.query(Transaction).filter(
            Transaction.shop_id == shop_id,
            Transaction.date >= first_day,
            Transaction.date <= last_day
        ).count()
        
        return {
            'can_create_transaction': current_month_transactions < feature_control.limit_value,
            'current_count': current_month_transactions,
            'limit': feature_control.limit_value,
            'remaining': max(0, feature_control.limit_value - current_month_transactions),
            'usage_percentage': (current_month_transactions / feature_control.limit_value) * 100,
            'reset_date': (today.replace(day=1) + timedelta(days=32)).replace(day=1)
        }
    
    def update_feature_control(
        self, 
        shop_id: int, 
        feature_name: str, 
        is_enabled: bool = None,
        limit_value: int = None,
        admin_id: int = None,
        reason: str = None
    ) -> FeatureControl:
        """Update feature control settings"""
        
        feature_control = self._get_feature_control(shop_id, feature_name)
        if not feature_control:
            raise ValueError(f"Feature control '{feature_name}' not found for shop {shop_id}")
        
        if is_enabled is not None:
            feature_control.is_enabled = is_enabled
        if limit_value is not None:
            feature_control.limit_value = limit_value
        if admin_id is not None:
            feature_control.controlled_by = admin_id
        if reason is not None:
            feature_control.reason = reason
            
        feature_control.updated_at = datetime.utcnow()
        
        self.db.commit()
        return feature_control
    
    def get_restriction_level(self, usage_percentage: float) -> str:
        """Determine restriction level based on usage percentage"""
        
        if usage_percentage >= 100:
            return "BLOCKED"
        elif usage_percentage >= 90:
            return "WARNING_CRITICAL"
        elif usage_percentage >= 75:
            return "WARNING_HIGH"
        elif usage_percentage >= 50:
            return "NOTICE"
        else:
            return "NORMAL"
    
    def _get_feature_control(self, shop_id: int, feature_name: str) -> Optional[FeatureControl]:
        """Get feature control for a specific shop and feature"""
        return self.db.query(FeatureControl).filter(
            FeatureControl.shop_id == shop_id,
            FeatureControl.feature_name == feature_name,
            FeatureControl.effective_from <= datetime.utcnow()
        ).filter(
            (FeatureControl.expires_at.is_(None)) | 
            (FeatureControl.expires_at > datetime.utcnow())
        ).first()


class UsageTrackingService:
    """Service for tracking feature usage and generating analytics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def track_usage(self, shop_id: int, feature_name: str, count: int = 1):
        """Track usage of a feature"""
        
        today = date.today()
        usage = self.db.query(UsageTracking).filter(
            UsageTracking.shop_id == shop_id,
            UsageTracking.feature_name == feature_name,
            UsageTracking.usage_date == today
        ).first()
        
        if usage:
            usage.usage_count += count
            usage.updated_at = datetime.utcnow()
        else:
            usage = UsageTracking(
                shop_id=shop_id,
                feature_name=feature_name,
                usage_count=count,
                usage_date=today,
                reset_cycle="DAILY"
            )
            self.db.add(usage)
        
        self.db.commit()
    
    def get_usage_summary(self, shop_id: int, days: int = 30) -> Dict[str, Any]:
        """Get usage summary for the last N days"""
        
        start_date = date.today() - timedelta(days=days)
        
        usage_data = self.db.query(UsageTracking).filter(
            UsageTracking.shop_id == shop_id,
            UsageTracking.usage_date >= start_date
        ).all()
        
        summary = {}
        for usage in usage_data:
            if usage.feature_name not in summary:
                summary[usage.feature_name] = {
                    'total_usage': 0,
                    'days_used': 0,
                    'avg_daily_usage': 0
                }
            
            summary[usage.feature_name]['total_usage'] += usage.usage_count
            summary[usage.feature_name]['days_used'] += 1
        
        # Calculate averages
        for feature, data in summary.items():
            if data['days_used'] > 0:
                data['avg_daily_usage'] = data['total_usage'] / data['days_used']
        
        return summary
    
    def predict_upgrade_need(self, shop_id: int) -> Dict[str, Any]:
        """Predict if shop needs to upgrade based on usage patterns"""
        
        feature_service = FeatureControlService(self.db)
        
        farmer_check = feature_service.check_farmer_creation_limit(shop_id)
        buyer_check = feature_service.check_buyer_creation_limit(shop_id)
        transaction_check = feature_service.check_transaction_limit(shop_id)
        
        upgrade_score = 0
        recommendations = []
        
        if farmer_check.get('usage_percentage', 0) > 80:
            upgrade_score += 30
            recommendations.append('Consider upgrading for more farmer capacity')
        
        if buyer_check.get('usage_percentage', 0) > 80:
            upgrade_score += 30
            recommendations.append('Consider upgrading for more buyer capacity')
        
        if transaction_check.get('usage_percentage', 0) > 80:
            upgrade_score += 40
            recommendations.append('Consider upgrading for higher transaction limits')
        
        return {
            'upgrade_score': upgrade_score,
            'recommendation_level': 'HIGH' if upgrade_score > 70 else 'MEDIUM' if upgrade_score > 40 else 'LOW',
            'recommendations': recommendations,
            'usage_summary': {
                'farmers': farmer_check,
                'buyers': buyer_check,
                'transactions': transaction_check
            }
        }


class BillingService:
    """Service for handling subscription billing and renewals"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def process_renewal(self, subscription_id: int) -> Subscription:
        """Process subscription renewal"""
        
        subscription = self.db.query(Subscription).filter(
            Subscription.id == subscription_id
        ).first()
        
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        if not subscription.auto_renew:
            subscription.status = SubscriptionStatus.EXPIRED
            self.db.commit()
            return subscription
        
        # Calculate new period
        new_start_date = subscription.end_date + timedelta(days=1)
        service = SubscriptionService(self.db)
        new_end_date = service._calculate_end_date(new_start_date, subscription.billing_cycle)
        
        # Calculate new amount (prices may have changed)
        plan = subscription.plan
        new_amount, new_discount = service._calculate_subscription_pricing(
            plan, subscription.billing_cycle
        )
        
        # Update subscription
        subscription.start_date = new_start_date
        subscription.end_date = new_end_date
        subscription.amount = new_amount
        subscription.discount_amount = new_discount
        subscription.payment_status = PaymentStatus.PENDING
        subscription.updated_at = datetime.utcnow()
        
        self.db.commit()
        return subscription
    
    def get_upcoming_renewals(self, days_ahead: int = 7) -> List[Subscription]:
        """Get subscriptions that will expire in the next N days"""
        
        cutoff_date = date.today() + timedelta(days=days_ahead)
        
        return self.db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.end_date <= cutoff_date,
            Subscription.auto_renew == True
        ).all()
    
    def calculate_revenue_analytics(self) -> Dict[str, Any]:
        """Calculate revenue analytics for admin dashboard"""
        
        # Monthly recurring revenue
        active_subscriptions = self.db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE
        ).all()
        
        mrr = sum(
            sub.amount / (
                12 if sub.billing_cycle == BillingCycle.YEARLY else
                4 if sub.billing_cycle == BillingCycle.QUARTERLY else 1
            ) for sub in active_subscriptions
        )
        
        # Annual recurring revenue
        arr = mrr * 12
        
        # Revenue by plan
        revenue_by_plan = {}
        for sub in active_subscriptions:
            plan_name = sub.plan.name
            monthly_revenue = sub.amount / (
                12 if sub.billing_cycle == BillingCycle.YEARLY else
                4 if sub.billing_cycle == BillingCycle.QUARTERLY else 1
            )
            
            if plan_name not in revenue_by_plan:
                revenue_by_plan[plan_name] = 0
            revenue_by_plan[plan_name] += monthly_revenue
        
        return {
            'monthly_recurring_revenue': float(mrr),
            'annual_recurring_revenue': float(arr),
            'active_subscriptions': len(active_subscriptions),
            'revenue_by_plan': {k: float(v) for k, v in revenue_by_plan.items()},
            'total_customers': len(set(sub.shop_id for sub in active_subscriptions))
        }
