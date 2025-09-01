
"""
Seed Script: 001 - Basic Reference Data
Purpose: Seeds basic reference data (categories, units, user roles, etc.)
Usage: python -m src.db.seeds.001_basic_reference_data
Dependencies: None
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import Category, Unit, UserRole, Plan
from datetime import datetime

def seed_basic_reference_data():
    """Seed basic reference data"""
    print("🌱 Seeding Basic Reference Data...")
    
    try:
        with get_db_session() as db:
            # Seed Categories
            categories = [
                {"name": "Vegetables", "description": "Fresh vegetables"},
                {"name": "Fruits", "description": "Fresh fruits"},
                {"name": "Grains", "description": "Cereals and grains"},
                {"name": "Pulses", "description": "Lentils and beans"}
            ]
            
            for cat_data in categories:
                existing = db.query(Category).filter_by(name=cat_data["name"]).first()
                if not existing:
                    category = Category(**cat_data)
                    db.add(category)
                    print(f"  ✅ Created category: {cat_data['name']}")
            
            # Seed Units
            units = [
                {"name": "kg", "description": "Kilogram"},
                {"name": "g", "description": "Gram"},
                {"name": "ton", "description": "Metric Ton"},
                {"name": "piece", "description": "Individual pieces"},
                {"name": "dozen", "description": "12 pieces"},
                {"name": "liter", "description": "Liter"}
            ]
            
            for unit_data in units:
                existing = db.query(Unit).filter_by(name=unit_data["name"]).first()
                if not existing:
                    unit = Unit(**unit_data)
                    db.add(unit)
                    print(f"  ✅ Created unit: {unit_data['name']}")
            
            # Seed Plans
            plans = [
                {
                    "name": "Basic",
                    "description": "Basic plan for small shops",
                    "monthly_price": 999.00,
                    "quarterly_price": 2700.00,
                    "yearly_price": 9990.00,
                    "max_farmers": 50,
                    "max_buyers": 100,
                    "max_transactions": 1000,
                    "data_retention_months": 12,
                    "features": {"basic_reports": True, "sms_notifications": False},
                    "status": "active"
                },
                {
                    "name": "Standard",
                    "description": "Standard plan for medium shops",
                    "monthly_price": 1999.00,
                    "quarterly_price": 5400.00,
                    "yearly_price": 19990.00,
                    "max_farmers": 150,
                    "max_buyers": 300,
                    "max_transactions": 5000,
                    "data_retention_months": 24,
                    "features": {"basic_reports": True, "sms_notifications": True, "advanced_analytics": True},
                    "status": "active"
                },
                {
                    "name": "Premium",
                    "description": "Premium plan for large shops",
                    "monthly_price": 3999.00,
                    "quarterly_price": 10800.00,
                    "yearly_price": 39990.00,
                    "max_farmers": 500,
                    "max_buyers": 1000,
                    "max_transactions": 20000,
                    "data_retention_months": 36,
                    "features": {"basic_reports": True, "sms_notifications": True, "advanced_analytics": True, "api_access": True},
                    "status": "active"
                }
            ]
            
            for plan_data in plans:
                existing = db.query(Plan).filter_by(name=plan_data["name"]).first()
                if not existing:
                    plan = Plan(**plan_data)
                    db.add(plan)
                    print(f"  ✅ Created plan: {plan_data['name']}")
            
            db.commit()
            print("✅ Basic reference data seeded successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding basic reference data: {str(e)}")
        return False

if __name__ == "__main__":
    success = seed_basic_reference_data()
    sys.exit(0 if success else 1)
