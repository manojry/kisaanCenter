#!/usr/bin/env python3
"""
Final Database Seeding Script
Seeds basic reference data that matches actual database schema
"""

import sys
sys.path.append('..')

from datetime import datetime, date
import decimal
from connection import DatabaseManager
from models import Category, PaymentMethod, Plan

def seed_basic_data():
    """Seed basic reference data into the database"""
    db_manager = DatabaseManager()
    
    with db_manager.get_db_session() as session:
        print("🌱 Starting database seeding...")
        
        # Seed Categories
        print("📦 Seeding Categories...")
        categories = [
            {"name": "Grains", "description": "Rice, Wheat, Barley, etc."},
            {"name": "Vegetables", "description": "Fresh vegetables and greens"},
            {"name": "Fruits", "description": "Fresh fruits and seasonal produce"},
            {"name": "Pulses", "description": "Lentils, Beans, Chickpeas, etc."},
            {"name": "Spices", "description": "Turmeric, Chili, Coriander, etc."},
            {"name": "Dairy", "description": "Milk, Cheese, Butter, etc."},
        ]
        
        for cat_data in categories:
            # Check if category already exists
            existing = session.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                category = Category(**cat_data)
                session.add(category)
                print(f"  ✅ Added category: {cat_data['name']}")
            else:
                print(f"  ⏭️  Category already exists: {cat_data['name']}")
        
        # Seed Payment Methods (using actual database columns)
        print("💰 Seeding Payment Methods...")
        payment_methods = [
            {
                "name": "Cash",
                "description": "Cash payment on delivery",
                "is_active": True
            },
            {
                "name": "UPI",
                "description": "Unified Payment Interface",
                "is_active": True
            },
            {
                "name": "Bank Transfer",
                "description": "Direct bank account transfer",
                "is_active": True
            },
            {
                "name": "Credit",
                "description": "Credit payment (to be settled later)",
                "is_active": True
            },
            {
                "name": "Cheque",
                "description": "Bank cheque payment",
                "is_active": True
            }
        ]
        
        for pm_data in payment_methods:
            # Check if payment method already exists
            existing = session.query(PaymentMethod).filter(PaymentMethod.name == pm_data["name"]).first()
            if not existing:
                payment_method = PaymentMethod(**pm_data)
                session.add(payment_method)
                print(f"  ✅ Added payment method: {pm_data['name']}")
            else:
                print(f"  ⏭️  Payment method already exists: {pm_data['name']}")
        
        # Seed Plans (using actual database columns)
        print("📋 Seeding Plans...")
        plans = [
            {
                "name": "Basic",
                "description": "Basic plan for small shops",
                "price": decimal.Decimal("499.00"),
                "billing_cycle": "monthly",
                "max_users": 3,
                "max_transactions": 100,
                "features": {"inventory": True, "basic_reports": True},
                "status": "active"
            },
            {
                "name": "Standard",
                "description": "Standard plan for medium shops",
                "price": decimal.Decimal("999.00"),
                "billing_cycle": "monthly",
                "max_users": 10,
                "max_transactions": 500,
                "features": {
                    "inventory": True,
                    "basic_reports": True,
                    "advanced_reports": True,
                    "farmer_management": True
                },
                "status": "active"
            },
            {
                "name": "Premium",
                "description": "Premium plan for large operations",
                "price": decimal.Decimal("1999.00"),
                "billing_cycle": "monthly",
                "max_users": 25,
                "max_transactions": 2000,
                "features": {
                    "inventory": True,
                    "basic_reports": True,
                    "advanced_reports": True,
                    "farmer_management": True,
                    "analytics": True,
                    "api_access": True
                },
                "status": "active"
            },
            {
                "name": "Enterprise",
                "description": "Enterprise plan for large scale operations",
                "price": decimal.Decimal("4999.00"),
                "billing_cycle": "monthly",
                "max_users": 100,
                "max_transactions": 10000,
                "features": {
                    "inventory": True,
                    "basic_reports": True,
                    "advanced_reports": True,
                    "farmer_management": True,
                    "analytics": True,
                    "api_access": True,
                    "custom_integrations": True,
                    "dedicated_support": True
                },
                "status": "active"
            }
        ]
        
        for plan_data in plans:
            # Ensure status is always lowercase 'active'
            if 'status' in plan_data and plan_data['status'] == 'ACTIVE':
                plan_data['status'] = 'active'
            # Check if plan already exists
            existing = session.query(Plan).filter(Plan.name == plan_data["name"]).first()
            if not existing:
                plan = Plan(**plan_data)
                session.add(plan)
                print(f"  ✅ Added plan: {plan_data['name']} - ₹{plan_data['price']}")
            else:
                print(f"  ⏭️  Plan already exists: {plan_data['name']}")
        
        # Show summary
        print("\n📊 Summary:")
        print(f"  Categories: {session.query(Category).count()}")
        print(f"  Payment Methods: {session.query(PaymentMethod).count()}")
        print(f"  Plans: {session.query(Plan).count()}")
        
        print("\n🎉 Database seeding completed successfully!")

if __name__ == "__main__":
    print("🚀 KisaanCenter Database Seeding")
    print("=" * 50)
    seed_basic_data()
    print("=" * 50)
    print("✨ Seeding process complete!")
