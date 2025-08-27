#!/usr/bin/env python3
"""
Test Subscription Management System

This script tests the subscription management implementation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
from datetime import date

from backend.src.models import Base, Plan, Subscription, Shop, BillingCycle, SubscriptionStatus
from backend.src.services.subscription_service import SubscriptionService, FeatureControlService

def test_subscription_system():
    """Test the subscription management system"""
    
    # Create in-memory database for testing
    engine = create_engine('sqlite:///test_subscription.db', echo=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🧪 Testing Subscription Management System")
        print("=" * 50)
        
        # 1. Create test plans
        print("\n1. Creating test plans...")
        basic_plan = Plan(
            name="Basic Plan",
            description="Perfect for small shops",
            monthly_price=Decimal("50.00"),
            quarterly_price=Decimal("142.50"),  # 5% discount
            yearly_price=Decimal("510.00"),     # 15% discount
            max_farmers=5,
            max_buyers=10,
            max_transactions=500,
            data_retention_months=6
        )
        
        premium_plan = Plan(
            name="Premium Plan", 
            description="For growing businesses",
            monthly_price=Decimal("100.00"),
            quarterly_price=Decimal("285.00"),
            yearly_price=Decimal("1020.00"),
            max_farmers=20,
            max_buyers=50,
            max_transactions=2000,
            data_retention_months=12
        )
        
        db.add(basic_plan)
        db.add(premium_plan)
        db.commit()
        print(f"✅ Created plans: {basic_plan.name}, {premium_plan.name}")
        
        # 2. Create test shop
        print("\n2. Creating test shop...")
        test_shop = Shop(
            name="Test Market",
            location="Test City"
        )
        db.add(test_shop)
        db.commit()
        print(f"✅ Created shop: {test_shop.name}")
        
        # 3. Test subscription creation
        print("\n3. Testing subscription creation...")
        subscription_service = SubscriptionService(db)
        
        subscription = subscription_service.create_subscription(
            shop_id=test_shop.id,
            plan_id=basic_plan.id,
            billing_cycle=BillingCycle.QUARTERLY
        )
        
        print(f"✅ Created subscription:")
        print(f"   Shop: {subscription.shop_id}")
        print(f"   Plan: {subscription.plan_id}")
        print(f"   Billing: {subscription.billing_cycle}")
        print(f"   Amount: ${subscription.amount}")
        print(f"   Discount: ${subscription.discount_amount}")
        
        # 4. Test feature controls
        print("\n4. Testing feature controls...")
        feature_service = FeatureControlService(db)
        
        farmer_limits = feature_service.check_farmer_creation_limit(test_shop.id)
        buyer_limits = feature_service.check_buyer_creation_limit(test_shop.id)
        
        print(f"✅ Farmer limits: {farmer_limits['current_count']}/{farmer_limits['limit']}")
        print(f"✅ Buyer limits: {buyer_limits['current_count']}/{buyer_limits['limit']}")
        
        # 5. Test upgrade
        print("\n5. Testing subscription upgrade...")
        upgraded_subscription = subscription_service.upgrade_subscription(
            shop_id=test_shop.id,
            new_plan_id=premium_plan.id,
            admin_id=1,
            reason="Testing upgrade functionality"
        )
        
        print(f"✅ Upgraded subscription:")
        print(f"   New Plan: {upgraded_subscription.plan_id}")
        print(f"   New Amount: ${upgraded_subscription.amount}")
        
        # 6. Test data access controls
        print("\n6. Testing data access controls...")
        data_access = feature_service.get_data_access_range(test_shop.id)
        print(f"✅ Data access:")
        print(f"   Accessible from: {data_access['accessible_from']}")
        print(f"   Retention months: {data_access['retention_months']}")
        print(f"   Is restricted: {data_access['is_restricted']}")
        
        print("\n🎉 All subscription tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_subscription_system()
