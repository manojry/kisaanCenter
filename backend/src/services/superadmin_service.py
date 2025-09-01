"""
Super Admin Enhanced Control Service

This service provides comprehensive super admin controls including:
- Shop-specific plan customizations
- Account management (enable/disable)
- Bulk operations
- Business protection mechanisms
- Change impact analysis

Related Documentation:
- Super Admin Controls: /Documents/Features/Super_Admin_Enhanced_Controls.md
- Subscription Plan: /Documents/Features/Subscription_Management_Plan.md
"""

from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Any, Tuple
import logging

from ..models import (
    Shop, Plan, Subscription, FeatureControl, User, 
    SubscriptionHistory, RecordStatus, SubscriptionStatus
)
from ..database import get_db

logger = logging.getLogger(__name__)

# Business Protection Constants
MIN_MONTHLY_PRICE = Decimal("29.99")
MAX_DISCOUNT_YEARLY = 25
MAX_DISCOUNT_QUARTERLY = 15
MAX_DATA_RETENTION_MONTHS = 84  # 7 years

RESOURCE_LIMITS = {
    'max_farmers': 1000,
    'max_buyers': 5000,
    'max_transactions': 100000
}

HIGH_RISK_THRESHOLDS = {
    'price_decrease_percent': 20,
    'discount_increase_percent': 10,
    'resource_increase_percent': 100
}

class BusinessError(Exception):
    """Business rule violation error"""
    pass

class ComplianceError(Exception):
    """Compliance violation error"""
    pass

class ResourceError(Exception):
    """Resource limit violation error"""
    pass

class SuperAdminControlService:
    """Enhanced super admin control service with business protection"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_shop_plan_override(
        self,
        shop_id: int,
        admin_id: int,
        overrides: Dict[str, Any],
        reason: str,
        valid_until: Optional[date] = None
    ) -> Dict[str, Any]:
        """Create shop-specific plan overrides with business protection"""
        
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise ValueError(f"Shop {shop_id} not found")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            raise ValueError(f"No active subscription found for shop {shop_id}")
        
        # Validate all overrides
        self._validate_overrides(shop_id, overrides)
        
        # Analyze change impact
        impact_analysis = self._analyze_change_impact(shop_id, overrides)
        
        # Check if approval is required
        approval_required, approval_reason = self._requires_approval(overrides)
        
        if approval_required:
            logger.warning(f"High-risk change requires approval: {approval_reason}")
            # In production, this would trigger an approval workflow
        
        # Apply overrides by updating feature controls
        updated_controls = []
        for feature_name, value in overrides.items():
            if feature_name.startswith('max_') or feature_name.endswith('_months'):
                control = self._update_or_create_feature_control(
                    shop_id=shop_id,
                    feature_name=self._map_override_to_feature(feature_name),
                    limit_value=value,
                    admin_id=admin_id,
                    reason=reason,
                    expires_at=datetime.combine(valid_until, datetime.min.time()) if valid_until else None
                )
                updated_controls.append(control)
        
        # Handle pricing overrides
        if any(k in overrides for k in ['monthly_price', 'discount_quarterly', 'discount_yearly']):
            self._apply_pricing_overrides(subscription, overrides, admin_id, reason)
        
        return {
            'shop_id': shop_id,
            'overrides_applied': overrides,
            'updated_controls': len(updated_controls),
            'impact_analysis': impact_analysis,
            'approval_required': approval_required,
            'approval_reason': approval_reason if approval_required else None,
            'valid_until': valid_until
        }
    
    def manage_shop_status(
        self,
        shop_id: int,
        admin_id: int,
        status: str,
        reason: str,
        cascade_to_users: bool = True,
        effective_immediately: bool = True
    ) -> Dict[str, Any]:
        """Enable/disable shop and optionally all its users"""
        
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise ValueError(f"Shop {shop_id} not found")
        
        old_status = shop.status
        
        # Update shop status
        if status in ['active', 'suspended', 'inactive']:
            shop.status = RecordStatus(status)
        else:
            raise ValueError(f"Invalid status: {status}")
        
        shop.updated_at = datetime.utcnow()
        
        users_affected = 0
        if cascade_to_users:
            # Update all shop users
            users_query = self.db.query(User).filter(User.shop_id == shop_id)
            users_affected = users_query.count()
            
            users_query.update({
                'status': RecordStatus(status),
                'updated_at': datetime.utcnow()
            })
        
        # Update subscription status if suspending
        if status == 'suspended':
            subscription = self.db.query(Subscription).filter(
                Subscription.shop_id == shop_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
            
            if subscription:
                subscription.status = SubscriptionStatus.SUSPENDED
                subscription.updated_at = datetime.utcnow()
        
        # Log the change
        self._log_admin_action(
            admin_id=admin_id,
            action="shop_status_change",
            entity_type="shop",
            entity_id=shop_id,
            old_data={'status': old_status},
            new_data={'status': status, 'reason': reason}
        )
        
        self.db.commit()
        
        return {
            'shop_id': shop_id,
            'old_status': old_status,
            'new_status': status,
            'users_affected': users_affected,
            'cascade_applied': cascade_to_users,
            'effective_immediately': effective_immediately,
            'reason': reason
        }
    
    def force_password_reset(
        self,
        user_id: int,
        admin_id: int,
        require_immediate_change: bool = True,
        send_notification: bool = True
    ) -> Dict[str, Any]:
        """Force password reset for a user"""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Generate temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # In production, you'd hash this password
        # user.password_hash = hash_password(temp_password)
        # user.force_password_change = require_immediate_change
        user.updated_at = datetime.utcnow()
        
        # Log the action
        self._log_admin_action(
            admin_id=admin_id,
            action="force_password_reset",
            entity_type="user",
            entity_id=user_id,
            old_data={},
            new_data={'require_immediate_change': require_immediate_change}
        )
        
        self.db.commit()
        
        # In production, send notification email/SMS
        if send_notification:
            self._send_password_reset_notification(user, temp_password)
        
        return {
            'user_id': user_id,
            'username': user.username,
            'temporary_password': temp_password,
            'require_immediate_change': require_immediate_change,
            'notification_sent': send_notification
        }
    
    def bulk_plan_changes(
        self,
        shop_ids: List[int],
        changes: Dict[str, Any],
        admin_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """Apply plan changes to multiple shops"""
        
        results = {
            'successful': [],
            'failed': [],
            'total_shops': len(shop_ids)
        }
        
        for shop_id in shop_ids:
            try:
                result = self.create_shop_plan_override(
                    shop_id=shop_id,
                    admin_id=admin_id,
                    overrides=changes,
                    reason=f"Bulk operation: {reason}"
                )
                results['successful'].append({
                    'shop_id': shop_id,
                    'result': result
                })
            except Exception as e:
                results['failed'].append({
                    'shop_id': shop_id,
                    'error': str(e)
                })
        
        return results
    
    def get_shop_overrides_summary(self, shop_id: int) -> Dict[str, Any]:
        """Get all active overrides for a shop"""
        
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise ValueError(f"Shop {shop_id} not found")
        
        # Get all feature controls (which include overrides)
        controls = self.db.query(FeatureControl).filter(
            FeatureControl.shop_id == shop_id
        ).all()
        
        # Get subscription for pricing info
        subscription = self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        overrides = {}
        for control in controls:
            if control.controlled_by:  # Only show admin-controlled features
                overrides[control.feature_name] = {
                    'current_value': control.limit_value,
                    'controlled_by': control.controlled_by,
                    'reason': control.reason,
                    'effective_from': control.effective_from,
                    'expires_at': control.expires_at
                }
        
        return {
            'shop_id': shop_id,
            'shop_name': shop.name,
            'plan_name': subscription.plan.name if subscription else None,
            'overrides': overrides,
            'subscription_status': subscription.status if subscription else None
        }
    
    def _validate_overrides(self, shop_id: int, overrides: Dict[str, Any]):
        """Validate override values against business rules"""
        
        for key, value in overrides.items():
            if key == 'monthly_price':
                if value < MIN_MONTHLY_PRICE:
                    raise BusinessError(f"Monthly price ${value} below minimum ${MIN_MONTHLY_PRICE}")
            
            elif key == 'discount_quarterly':
                if value > MAX_DISCOUNT_QUARTERLY:
                    raise BusinessError(f"Quarterly discount {value}% exceeds maximum {MAX_DISCOUNT_QUARTERLY}%")
            
            elif key == 'discount_yearly':
                if value > MAX_DISCOUNT_YEARLY:
                    raise BusinessError(f"Yearly discount {value}% exceeds maximum {MAX_DISCOUNT_YEARLY}%")
            
            elif key == 'data_retention_months':
                if value > MAX_DATA_RETENTION_MONTHS:
                    raise ComplianceError(f"Data retention {value} months exceeds maximum {MAX_DATA_RETENTION_MONTHS}")
            
            elif key.startswith('max_'):
                feature_name = key[4:]  # Remove 'max_' prefix
                if feature_name in RESOURCE_LIMITS:
                    if value > RESOURCE_LIMITS[feature_name]:
                        raise ResourceError(f"{key} {value} exceeds hard limit {RESOURCE_LIMITS[feature_name]}")
            
            # Validate against current usage
            if key in ['max_farmers', 'max_buyers']:
                current_count = self._get_current_usage(shop_id, key)
                if value < current_count:
                    raise BusinessError(
                        f"Cannot reduce {key} to {value}. "
                        f"Shop currently has {current_count}. "
                        f"Remove users first or set grace period."
                    )
    
    def _analyze_change_impact(self, shop_id: int, overrides: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the business impact of proposed changes"""
        
        subscription = self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        impact = {
            'revenue_impact': 0,
            'customer_satisfaction_risk': 'low',
            'operational_impact': 'minimal',
            'compliance_risk': 'low'
        }
        
        if 'monthly_price' in overrides and subscription:
            old_price = subscription.amount
            new_price = overrides['monthly_price']
            price_change_percent = ((new_price - old_price) / old_price) * 100
            
            impact['revenue_impact'] = float(price_change_percent)
            
            if price_change_percent < -10:
                impact['customer_satisfaction_risk'] = 'low'  # Price decrease = happy customers
            elif price_change_percent > 20:
                impact['customer_satisfaction_risk'] = 'high'  # Large price increase = unhappy customers
        
        # Assess resource changes
        for key in ['max_farmers', 'max_buyers', 'max_transactions']:
            if key in overrides:
                current_limit = self._get_current_limit(shop_id, key)
                new_limit = overrides[key]
                
                if new_limit > current_limit * 2:  # >100% increase
                    impact['operational_impact'] = 'significant'
                elif new_limit < current_limit * 0.5:  # >50% decrease
                    impact['operational_impact'] = 'significant'
        
        return impact
    
    def _requires_approval(self, overrides: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Determine if changes require additional approval"""
        
        # Check price decreases
        if 'monthly_price' in overrides:
            # Would need to compare with current price, simplified for now
            return False, None
        
        # Check discount increases
        for key in ['discount_quarterly', 'discount_yearly']:
            if key in overrides:
                if overrides[key] > HIGH_RISK_THRESHOLDS['discount_increase_percent']:
                    return True, f"{key} increase >{HIGH_RISK_THRESHOLDS['discount_increase_percent']}% requires approval"
        
        # Check resource increases
        for key in ['max_farmers', 'max_buyers', 'max_transactions']:
            if key in overrides:
                # Would need to compare with current limits, simplified for now
                pass
        
        return False, None
    
    def _update_or_create_feature_control(
        self,
        shop_id: int,
        feature_name: str,
        limit_value: int,
        admin_id: int,
        reason: str,
        expires_at: Optional[datetime] = None
    ) -> FeatureControl:
        """Update existing or create new feature control"""
        
        control = self.db.query(FeatureControl).filter(
            FeatureControl.shop_id == shop_id,
            FeatureControl.feature_name == feature_name
        ).first()
        
        if control:
            control.limit_value = limit_value
            control.controlled_by = admin_id
            control.reason = reason
            control.expires_at = expires_at
            control.updated_at = datetime.utcnow()
        else:
            control = FeatureControl(
                shop_id=shop_id,
                feature_name=feature_name,
                limit_value=limit_value,
                controlled_by=admin_id,
                reason=reason,
                expires_at=expires_at
            )
            self.db.add(control)
        
        return control
    
    def _map_override_to_feature(self, override_key: str) -> str:
        """Map override keys to feature control names"""
        mapping = {
            'max_farmers': 'farmer_creation',
            'max_buyers': 'buyer_creation',
            'data_retention_months': 'data_retention',
            'max_transactions': 'monthly_transactions'
        }
        return mapping.get(override_key, override_key)
    
    def _apply_pricing_overrides(
        self,
        subscription: Subscription,
        overrides: Dict[str, Any],
        admin_id: int,
        reason: str
    ):
        """Apply pricing overrides to subscription"""
        
        if 'monthly_price' in overrides:
            old_amount = subscription.amount
            subscription.amount = Decimal(str(overrides['monthly_price']))
            
            # Create history record
            history = SubscriptionHistory(
                subscription_id=subscription.id,
                shop_id=subscription.shop_id,
                previous_plan_id=subscription.plan_id,
                new_plan_id=subscription.plan_id,  # Same plan, different pricing
                change_reason=f"Pricing override: {reason}",
                changed_by=admin_id,
                effective_date=date.today()
            )
            self.db.add(history)
    
    def _get_current_usage(self, shop_id: int, resource_type: str) -> int:
        """Get current usage count for a resource type"""
        if resource_type == 'max_farmers':
            return self.db.query(User).filter(
                User.shop_id == shop_id,
                User.role.in_(['farmer']),
                User.status == 'active'
            ).count()
        elif resource_type == 'max_buyers':
            return self.db.query(User).filter(
                User.shop_id == shop_id,
                User.role.in_(['buyer']),
                User.status == 'active'
            ).count()
        return 0
    
    def _get_current_limit(self, shop_id: int, feature_name: str) -> int:
        """Get current limit for a feature"""
        control = self.db.query(FeatureControl).filter(
            FeatureControl.shop_id == shop_id,
            FeatureControl.feature_name == self._map_override_to_feature(feature_name)
        ).first()
        return control.limit_value if control else 0
    
    def _log_admin_action(
        self,
        admin_id: int,
        action: str,
        entity_type: str,
        entity_id: int,
        old_data: Dict[str, Any],
        new_data: Dict[str, Any]
    ):
        """Log admin actions for audit trail"""
        from ..models import AuditLog, AuditAction
        
        audit_log = AuditLog(
            entity_type=f"admin_{entity_type}",
            entity_id=entity_id,
            user_id=admin_id,
            action=AuditAction.UPDATE,
            old_data=old_data,
            new_data=new_data
        )
        self.db.add(audit_log)
    
    def _send_password_reset_notification(self, user, temp_password: str):
        """Send password reset notification (placeholder)"""
        # In production, implement email/SMS notification
        logger.info(f"Password reset notification sent to user {user.username}")


class ShopAnalyticsService:
    """Service for shop analytics and insights for super admin"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_shop_performance_metrics(self, shop_id: int) -> Dict[str, Any]:
        """Get comprehensive shop performance metrics"""
        
        shop = self.db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise ValueError(f"Shop {shop_id} not found")
        
        # Get user counts
        farmer_count = self.db.query(User).filter(
            User.shop_id == shop_id,
            User.role.in_(['farmer']),
            User.status == 'active'
        ).count()
        
        buyer_count = self.db.query(User).filter(
            User.shop_id == shop_id,
            User.role.in_(['buyer']),
            User.status == 'active'
        ).count()
        
        # Get transaction metrics (would need Transaction model)
        # transaction_count = self.db.query(Transaction).filter(...).count()
        
        # Get subscription info
        subscription = self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        return {
            'shop_id': shop_id,
            'shop_name': shop.name,
            'status': shop.status,
            'user_metrics': {
                'farmer_count': farmer_count,
                'buyer_count': buyer_count,
                'total_users': farmer_count + buyer_count
            },
            'subscription_info': {
                'plan_name': subscription.plan.name if subscription else None,
                'billing_cycle': subscription.billing_cycle if subscription else None,
                'monthly_revenue': float(subscription.amount) if subscription else 0,
                'status': subscription.status if subscription else None
            },
            'risk_factors': self._assess_risk_factors(shop_id)
        }
    
    def _assess_risk_factors(self, shop_id: int) -> List[str]:
        """Assess risk factors for a shop"""
        risks = []
        
        # Check payment status
        subscription = self.db.query(Subscription).filter(
            Subscription.shop_id == shop_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        if subscription and subscription.payment_status in ['overdue', 'failed']:
            risks.append('Payment issues')
        
        # Check usage patterns
        # if low_activity_detected(shop_id):
        #     risks.append('Low activity')
        
        return risks
