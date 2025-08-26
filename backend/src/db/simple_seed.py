#!/usr/bin/env python3
"""
Simple database seeding script for KisaanCenter
"""

import sys
import os

# Add the parent src directory to Python path to access models.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from connection import db_manager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_basic_data():
    """Seed basic reference data"""
    try:
        with db_manager.get_db_session() as session:
            logger.info("🌱 Starting basic data seeding...")
            
            # Check if we already have data
            from models import Category, Plan, PaymentMethod
            
            # Seed Categories
            categories = [
                {'name': 'Vegetables', 'description': 'Fresh vegetables'},
                {'name': 'Fruits', 'description': 'Fresh fruits'},
                {'name': 'Grains', 'description': 'Cereals and grains'},
                {'name': 'Pulses', 'description': 'Lentils and pulses'},
                {'name': 'Dairy', 'description': 'Milk and dairy products'},
            ]
            
            for cat_data in categories:
                existing = session.query(Category).filter_by(name=cat_data['name']).first()
                if not existing:
                    category = Category(**cat_data)
                    session.add(category)
                    logger.info(f"✅ Added category: {cat_data['name']}")
                else:
                    logger.info(f"⏭️ Category already exists: {cat_data['name']}")
            
            # Seed Plans
            plans = [
                {'name': 'Basic', 'price': 0.00, 'description': 'Basic free plan'},
                {'name': 'Standard', 'price': 99.00, 'description': 'Standard monthly plan'},
                {'name': 'Premium', 'price': 199.00, 'description': 'Premium monthly plan'},
                {'name': 'Enterprise', 'price': 499.00, 'description': 'Enterprise monthly plan'},
            ]
            
            for plan_data in plans:
                existing = session.query(Plan).filter_by(name=plan_data['name']).first()
                if not existing:
                    plan = Plan(**plan_data)
                    session.add(plan)
                    logger.info(f"✅ Added plan: {plan_data['name']}")
                else:
                    logger.info(f"⏭️ Plan already exists: {plan_data['name']}")
            
            # Seed Payment Methods
            payment_methods = [
                {'name': 'Cash', 'description': 'Cash payment'},
                {'name': 'UPI', 'description': 'UPI digital payment'},
                {'name': 'Card', 'description': 'Credit/Debit card'},
                {'name': 'Bank Transfer', 'description': 'Direct bank transfer'},
                {'name': 'Credit', 'description': 'Credit/Pay later'},
            ]
            
            for pm_data in payment_methods:
                existing = session.query(PaymentMethod).filter_by(name=pm_data['name']).first()
                if not existing:
                    payment_method = PaymentMethod(**pm_data)
                    session.add(payment_method)
                    logger.info(f"✅ Added payment method: {pm_data['name']}")
                else:
                    logger.info(f"⏭️ Payment method already exists: {pm_data['name']}")
            
            session.commit()
            logger.info("🎉 Basic data seeding completed successfully!")
            return True
            
    except Exception as e:
        logger.error(f"💥 Seeding failed: {str(e)}")
        if 'session' in locals():
            session.rollback()
        return False

if __name__ == "__main__":
    success = seed_basic_data()
    if success:
        print("✅ Database seeding completed successfully!")
    else:
        print("❌ Database seeding failed!")
        sys.exit(1)
