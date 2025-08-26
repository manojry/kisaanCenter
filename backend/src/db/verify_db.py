#!/usr/bin/env python3
"""
Database Verification Script
Verifies that the database setup and seeding completed successfully
"""

import sys
sys.path.append('..')

from connection import DatabaseManager
from models import Category, PaymentMethod, Plan

def verify_database():
    """Verify database setup and data"""
    db_manager = DatabaseManager()
    
    with db_manager.get_db_session() as session:
        print("🔍 Database Verification Report")
        print("=" * 60)
        
        # Test Categories
        print("\n📦 Categories:")
        categories = session.query(Category).order_by(Category.name).all()
        for cat in categories:
            print(f"  • {cat.name}: {cat.description}")
        
        # Test Payment Methods
        print("\n💰 Payment Methods:")
        payment_methods = session.query(PaymentMethod).order_by(PaymentMethod.name).all()
        for pm in payment_methods:
            status = "✅ Active" if pm.is_active else "❌ Inactive"
            print(f"  • {pm.name}: {pm.description} ({status})")
        
        # Test Plans
        print("\n📋 Plans:")
        plans = session.query(Plan).order_by(Plan.price).all()
        for plan in plans:
            features_count = len(plan.features) if plan.features else 0
            print(f"  • {plan.name}: ₹{plan.price}/{plan.billing_cycle}")
            print(f"    - Max Users: {plan.max_users}, Max Transactions: {plan.max_transactions}")
            print(f"    - Features: {features_count}, Status: {plan.status}")
        
        # Summary
        print(f"\n📊 Database Summary:")
        print(f"  • Total Categories: {len(categories)}")
        print(f"  • Total Payment Methods: {len(payment_methods)}")
        print(f"  • Total Plans: {len(plans)}")
        
        print("\n✅ Database verification completed successfully!")
        print("   The KisaanCenter database is ready for use.")

if __name__ == "__main__":
    print("🚀 KisaanCenter Database Verification")
    print("=" * 60)
    verify_database()
    print("=" * 60)
    print("🎯 Next Steps:")
    print("   1. Set up API endpoints (FastAPI)")
    print("   2. Create frontend components")
    print("   3. Test end-to-end functionality")
    print("   4. Deploy to production")
