
"""
Seed Script: 005 - Commission Rules
Purpose: Seeds commission rules for different shops and products
Usage: python -m src.db.seeds.seed_005_commission_rules
Dependencies: All previous seed scripts
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import CommissionRule, Shop, Product, Category
from src.core.enums import RecordStatus
from datetime import datetime, date
from decimal import Decimal

def seed_commission_rules():
    """Seed commission rules for shops"""
    print("🌱 Seeding Commission Rules...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            shops = db.query(Shop).all()
            products = db.query(Product).all()
            categories = db.query(Category).all()
            
            if not all([shops, products, categories]):
                print("  ⚠️  Missing reference data. Please run previous seed scripts first.")
                return False
            
            # Commission rules scenarios
            commission_rules = [
                {
                    "shop": shops[0],  # Green Valley Agro Center
                    "product": products[0],  # Tomato
                    "rate": Decimal("5.0"),
                    "description": "Special rate for tomatoes"
                },
                {
                    "shop": shops[0],  # Green Valley Agro Center
                    "category": categories[0],  # Vegetables
                    "rate": Decimal("4.5"),
                    "description": "Standard rate for all vegetables"
                },
                {
                    "shop": shops[1] if len(shops) > 1 else shops[0],  # Fresh Farm Hub
                    "category": categories[1],  # Fruits
                    "rate": Decimal("6.0"),
                    "description": "Premium rate for fruits"
                },
                {
                    "shop": shops[0],  # Green Valley Agro Center
                    "rate": Decimal("5.0"),
                    "description": "Default shop commission rate"
                }
            ]
            
            for rule_data in commission_rules:
                # Check if rule already exists
                existing_rule = db.query(CommissionRule).filter_by(
                    shop_id=rule_data["shop"].id,
                    product_id=rule_data.get("product").id if rule_data.get("product") else None,
                    category_id=rule_data.get("category").id if rule_data.get("category") else None
                ).first()
                
                if not existing_rule:
                    commission_rule = CommissionRule(
                        shop_id=rule_data["shop"].id,
                        product_id=rule_data.get("product").id if rule_data.get("product") else None,
                        category_id=rule_data.get("category").id if rule_data.get("category") else None,
                        commission_rate=rule_data["rate"],
                        effective_from=date.today(),
                        effective_to=None,
                        description=rule_data["description"],
                        status=RecordStatus.ACTIVE
                    )
                    db.add(commission_rule)
                    print(f"  ✅ Added commission rule: {commission_rule.description}")
            
            db.commit()
            print("✅ Commission Rules seeding completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding commission rules: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return False

if __name__ == "__main__":
    seed_commission_rules()
