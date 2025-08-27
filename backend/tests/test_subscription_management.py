"""
Comprehensive Test Cases for Subscription Management System

This test file covers all aspects of the subscription management system including:
- Plan management and pricing
- Subscription lifecycle (create, upgrade, renew)
- Feature control and restrictions
- Usage tracking and analytics
- Edge cases and business logic validation

Related Documentation:
- Subscription Plan: /Documents/Features/Subscription_Management_Plan.md
- Test Cases: /docs/COMPREHENSIVE_TEST_CASES.md
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from decimal import Decimal

from src.main import app
from src.database import get_db
from src.models import (
    Plan, Subscription, FeatureControl, UsageTracking, Shop, User,
    BillingCycle, SubscriptionStatus, PaymentStatus, UserRole
)
from src.services.subscription_service import (
    SubscriptionService, FeatureControlService, 
    UsageTrackingService, BillingService
)

client = TestClient(app)

class TestSubscriptionManagement:
    """Test subscription management functionality"""
    
    def test_create_basic_plan(self, db: Session):
        """Test creating a basic subscription plan"""
        plan_data = {
            "name": "Basic Plan",
            "description": "Perfect for small shops",
            "monthly_price": 99.99,
            "max_farmers": 5,
            "max_buyers": 10,
            "max_transactions": 500,
            "data_retention_months": 6
        }
        
        response = client.post("/api/v1/subscriptions/plans", json=plan_data)
        assert response.status_code == 200
        
        plan = response.json()
        assert plan["name"] == "Basic Plan"
        assert plan["monthly_price"] == "99.99"
        assert plan["quarterly_price"] == str(99.99 * 3 * 0.95)  # 5% discount
        assert plan["yearly_price"] == str(99.99 * 12 * 0.85)    # 15% discount
    
    def test_billing_cycle_pricing(self, db: Session):
        """Test different billing cycle pricing calculations"""
        service = SubscriptionService(db)
        
        # Create test plan
        plan = Plan(
            name="Test Plan",
            monthly_price=Decimal("100.00"),
            max_farmers=10,
            max_buyers=20
        )
        db.add(plan)
        db.commit()
        
        # Test monthly pricing (no discount)
        monthly_amount, monthly_discount = service._calculate_subscription_pricing(
            plan, BillingCycle.MONTHLY
        )
        assert monthly_amount == Decimal("100.00")
        assert monthly_discount == Decimal("0.00")
        
        # Test quarterly pricing (5% discount)
        quarterly_amount, quarterly_discount = service._calculate_subscription_pricing(
            plan, BillingCycle.QUARTERLY
        )
        expected_quarterly = Decimal("300.00") * Decimal("0.95")
        assert quarterly_amount == expected_quarterly
        assert quarterly_discount == Decimal("15.00")
        
        # Test yearly pricing (15% discount)
        yearly_amount, yearly_discount = service._calculate_subscription_pricing(
            plan, BillingCycle.YEARLY
        )
        expected_yearly = Decimal("1200.00") * Decimal("0.85")
        assert yearly_amount == expected_yearly
        assert yearly_discount == Decimal("180.00")
    
    def test_subscription_creation(self, db: Session, test_shop, test_plan):
        """Test creating a new subscription"""
        subscription_data = {
            "shop_id": test_shop.id,
            "plan_id": test_plan.id,
            "billing_cycle": "quarterly"
        }
        
        response = client.post("/api/v1/subscriptions/", json=subscription_data)
        assert response.status_code == 200
        
        subscription = response.json()
        assert subscription["shop_id"] == test_shop.id
        assert subscription["plan_id"] == test_plan.id
        assert subscription["billing_cycle"] == "quarterly"
        assert subscription["status"] == "active"
        
        # Verify feature controls were created
        response = client.get(f"/api/v1/subscriptions/shop/{test_shop.id}/feature-controls")
        assert response.status_code == 200
        controls = response.json()
        assert len(controls) >= 4  # farmer_creation, buyer_creation, data_retention, monthly_transactions
    
    def test_subscription_upgrade(self, db: Session, test_subscription, test_premium_plan):
        """Test upgrading subscription to a higher plan"""
        shop_id = test_subscription.shop_id
        
        upgrade_data = {
            "new_plan_id": test_premium_plan.id,
            "reason": "Need more capacity for growing business"
        }
        
        response = client.put(
            f"/api/v1/subscriptions/shop/{shop_id}/upgrade",
            json=upgrade_data
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "Subscription upgraded successfully" in result["message"]
        
        # Verify subscription was updated
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}")
        subscription = response.json()
        assert subscription["plan_id"] == test_premium_plan.id


class TestFeatureControls:
    """Test feature control and restriction functionality"""
    
    def test_farmer_creation_limit(self, db: Session, test_subscription):
        """Test farmer creation limits"""
        shop_id = test_subscription.shop_id
        
        # Check initial limit
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/limits/farmers")
        assert response.status_code == 200
        
        limit_info = response.json()
        assert limit_info["can_create"] == True
        assert limit_info["current_count"] == 0
        assert limit_info["limit"] > 0
        assert limit_info["status"] == "NORMAL"
    
    def test_buyer_creation_limit(self, db: Session, test_subscription):
        """Test buyer creation limits"""
        shop_id = test_subscription.shop_id
        
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/limits/buyers")
        assert response.status_code == 200
        
        limit_info = response.json()
        assert limit_info["can_create"] == True
        assert limit_info["current_count"] == 0
        assert limit_info["limit"] > 0
        assert limit_info["status"] == "NORMAL"
    
    def test_transaction_limit(self, db: Session, test_subscription):
        """Test monthly transaction limits"""
        shop_id = test_subscription.shop_id
        
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/limits/transactions")
        assert response.status_code == 200
        
        limit_info = response.json()
        assert limit_info["can_create_transaction"] == True
        assert limit_info["current_count"] == 0
        assert limit_info["limit"] > 0
        assert "reset_date" in limit_info
    
    def test_data_retention_access(self, db: Session, test_subscription):
        """Test data retention access controls"""
        shop_id = test_subscription.shop_id
        
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/data-access")
        assert response.status_code == 200
        
        access_info = response.json()
        assert access_info["feature"] == "data_retention"
        assert access_info["is_restricted"] == True
        assert "accessible_from" in access_info
        assert "accessible_to" in access_info
    
    def test_feature_control_update(self, db: Session, test_subscription):
        """Test updating feature control settings"""
        shop_id = test_subscription.shop_id
        
        # Update farmer creation limit
        update_data = {
            "feature_name": "farmer_creation",
            "limit_value": 15,
            "reason": "Customer requested increase"
        }
        
        response = client.put(
            f"/api/v1/subscriptions/shop/{shop_id}/feature-controls",
            json=update_data
        )
        assert response.status_code == 200
        
        # Verify the update
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/limits/farmers")
        limit_info = response.json()
        assert limit_info["limit"] == 15
    
    def test_restriction_levels(self, db: Session):
        """Test different restriction levels based on usage percentage"""
        service = FeatureControlService(db)
        
        assert service.get_restriction_level(0) == "NORMAL"
        assert service.get_restriction_level(50) == "NOTICE"
        assert service.get_restriction_level(75) == "WARNING_HIGH"
        assert service.get_restriction_level(90) == "WARNING_CRITICAL"
        assert service.get_restriction_level(100) == "BLOCKED"


class TestUsageTracking:
    """Test usage tracking and analytics functionality"""
    
    def test_track_feature_usage(self, db: Session, test_subscription):
        """Test tracking feature usage"""
        shop_id = test_subscription.shop_id
        
        # Track farmer creation usage
        response = client.post(
            f"/api/v1/subscriptions/shop/{shop_id}/usage/track?feature_name=farmer_creation&count=1"
        )
        assert response.status_code == 200
        
        # Track buyer creation usage
        response = client.post(
            f"/api/v1/subscriptions/shop/{shop_id}/usage/track?feature_name=buyer_creation&count=2"
        )
        assert response.status_code == 200
    
    def test_usage_summary(self, db: Session, test_subscription):
        """Test getting usage summary"""
        shop_id = test_subscription.shop_id
        
        # Track some usage first
        service = UsageTrackingService(db)
        service.track_usage(shop_id, "farmer_creation", 3)
        service.track_usage(shop_id, "buyer_creation", 5)
        
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/usage?days=30")
        assert response.status_code == 200
        
        summary = response.json()
        assert summary["shop_id"] == shop_id
        assert summary["period_days"] == 30
        assert "usage_summary" in summary
    
    def test_upgrade_prediction(self, db: Session, test_subscription):
        """Test upgrade need prediction"""
        shop_id = test_subscription.shop_id
        
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/upgrade-prediction")
        assert response.status_code == 200
        
        prediction = response.json()
        assert "prediction" in prediction
        assert "upgrade_score" in prediction["prediction"]
        assert "recommendation_level" in prediction["prediction"]
        assert "recommendations" in prediction["prediction"]


class TestBillingAndRenewals:
    """Test billing and renewal functionality"""
    
    def test_subscription_renewal(self, db: Session, test_subscription):
        """Test manual subscription renewal"""
        shop_id = test_subscription.shop_id
        
        response = client.post(f"/api/v1/subscriptions/shop/{shop_id}/renew")
        assert response.status_code == 200
        
        result = response.json()
        assert "Subscription renewed successfully" in result["message"]
    
    def test_upcoming_renewals(self, db: Session):
        """Test getting upcoming renewals"""
        response = client.get("/api/v1/subscriptions/admin/renewals/upcoming?days=7")
        assert response.status_code == 200
        
        renewals = response.json()
        assert "upcoming_renewals_count" in renewals
        assert "days_ahead" in renewals
        assert "renewals" in renewals
    
    def test_revenue_analytics(self, db: Session):
        """Test revenue analytics"""
        response = client.get("/api/v1/subscriptions/admin/analytics/revenue")
        assert response.status_code == 200
        
        analytics = response.json()
        assert "monthly_recurring_revenue" in analytics
        assert "annual_recurring_revenue" in analytics
        assert "active_subscriptions" in analytics
        assert "revenue_by_plan" in analytics
    
    def test_subscription_analytics(self, db: Session):
        """Test subscription analytics"""
        response = client.get("/api/v1/subscriptions/admin/analytics/subscriptions")
        assert response.status_code == 200
        
        analytics = response.json()
        assert "subscription_status_distribution" in analytics
        assert "billing_cycle_distribution" in analytics
        assert "plan_popularity" in analytics


class TestEdgeCases:
    """Test edge cases and business logic validation"""
    
    def test_create_subscription_invalid_plan(self, db: Session, test_shop):
        """Test creating subscription with invalid plan"""
        subscription_data = {
            "shop_id": test_shop.id,
            "plan_id": 99999,  # Non-existent plan
            "billing_cycle": "monthly"
        }
        
        response = client.post("/api/v1/subscriptions/", json=subscription_data)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"]
    
    def test_upgrade_to_same_plan(self, db: Session, test_subscription):
        """Test upgrading to the same plan"""
        shop_id = test_subscription.shop_id
        current_plan_id = test_subscription.plan_id
        
        upgrade_data = {
            "new_plan_id": current_plan_id,
            "reason": "Testing same plan upgrade"
        }
        
        response = client.put(
            f"/api/v1/subscriptions/shop/{shop_id}/upgrade",
            json=upgrade_data
        )
        # Should still work but no real change
        assert response.status_code == 200
    
    def test_feature_limit_at_boundary(self, db: Session, test_subscription):
        """Test feature limits at boundary conditions"""
        shop_id = test_subscription.shop_id
        service = FeatureControlService(db)
        
        # Set farmer limit to 1
        service.update_feature_control(
            shop_id=shop_id,
            feature_name="farmer_creation",
            limit_value=1
        )
        
        # Check when at 0 usage (should be normal)
        result = service.check_farmer_creation_limit(shop_id)
        assert result["can_create"] == True
        assert result["usage_percentage"] == 0
        
        # Simulate having 1 farmer (at limit)
        # This would require creating actual farmer users in the test
        # For now, we test the logic directly
    
    def test_expired_subscription_access(self, db: Session, test_subscription):
        """Test access controls for expired subscription"""
        # Set subscription to expired
        test_subscription.status = SubscriptionStatus.EXPIRED
        db.commit()
        
        shop_id = test_subscription.shop_id
        
        # Feature limits should still be queryable but may be restricted
        response = client.get(f"/api/v1/subscriptions/shop/{shop_id}/limits/farmers")
        assert response.status_code == 200
    
    def test_negative_usage_tracking(self, db: Session, test_subscription):
        """Test that negative usage counts are not allowed"""
        shop_id = test_subscription.shop_id
        
        response = client.post(
            f"/api/v1/subscriptions/shop/{shop_id}/usage/track?feature_name=farmer_creation&count=-1"
        )
        # Should reject negative counts
        assert response.status_code == 422  # Validation error
    
    def test_future_start_date_subscription(self, db: Session, test_shop, test_plan):
        """Test creating subscription with future start date"""
        future_date = (date.today() + timedelta(days=30)).isoformat()
        
        subscription_data = {
            "shop_id": test_shop.id,
            "plan_id": test_plan.id,
            "billing_cycle": "monthly",
            "start_date": future_date
        }
        
        response = client.post("/api/v1/subscriptions/", json=subscription_data)
        assert response.status_code == 200
        
        subscription = response.json()
        assert subscription["start_date"] == future_date
    
    def test_past_start_date_subscription(self, db: Session, test_shop, test_plan):
        """Test creating subscription with past start date (should be rejected)"""
        past_date = (date.today() - timedelta(days=1)).isoformat()
        
        subscription_data = {
            "shop_id": test_shop.id,
            "plan_id": test_plan.id,
            "billing_cycle": "monthly", 
            "start_date": past_date
        }
        
        response = client.post("/api/v1/subscriptions/", json=subscription_data)
        assert response.status_code == 422  # Validation error


class TestSubscriptionHealthCheck:
    """Test subscription system health check"""
    
    def test_subscription_health_endpoint(self):
        """Test subscription health check endpoint"""
        response = client.get("/api/v1/subscriptions/health")
        assert response.status_code == 200
        
        health = response.json()
        assert health["status"] == "healthy"
        assert "timestamp" in health
        assert "metrics" in health
        assert "total_plans" in health["metrics"]
        assert "total_subscriptions" in health["metrics"]


# Fixtures for testing

@pytest.fixture
def test_plan(db: Session):
    """Create a test plan"""
    plan = Plan(
        name="Test Plan",
        description="Plan for testing",
        monthly_price=Decimal("50.00"),
        quarterly_price=Decimal("142.50"),  # 5% discount
        yearly_price=Decimal("510.00"),     # 15% discount
        max_farmers=5,
        max_buyers=10,
        max_transactions=500,
        data_retention_months=6
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@pytest.fixture
def test_premium_plan(db: Session):
    """Create a premium test plan"""
    plan = Plan(
        name="Premium Test Plan",
        description="Premium plan for testing",
        monthly_price=Decimal("100.00"),
        quarterly_price=Decimal("285.00"),
        yearly_price=Decimal("1020.00"),
        max_farmers=20,
        max_buyers=50,
        max_transactions=2000,
        data_retention_months=12
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@pytest.fixture
def test_shop(db: Session):
    """Create a test shop"""
    shop = Shop(
        name="Test Shop",
        location="Test Location"
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop

@pytest.fixture
def test_subscription(db: Session, test_shop, test_plan):
    """Create a test subscription"""
    subscription = Subscription(
        shop_id=test_shop.id,
        plan_id=test_plan.id,
        billing_cycle=BillingCycle.MONTHLY,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        amount=test_plan.monthly_price,
        discount_amount=Decimal("0.00"),
        status=SubscriptionStatus.ACTIVE,
        payment_status=PaymentStatus.PAID
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    # Create feature controls for the subscription
    service = SubscriptionService(db)
    service._initialize_feature_controls(test_shop.id, test_plan)
    
    return subscription

# Test runner
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
