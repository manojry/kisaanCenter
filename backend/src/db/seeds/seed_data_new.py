"""
Database seeding utilities
Provides initial data setup and test data generation for ERD-compliant schema
"""

import sys
import os
import logging
from typing import List, Dict, Any
from decimal import Decimal

# Always set sys.path to project root for backend.src imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from sqlalchemy.exc import IntegrityError
from src.models import (
    User, UserRole, Shop, Product, Category, Plan, PaymentMethod,
    RecordStatus, ExpenseCategory
)
from src.db.connection import get_db_session

logger = logging.getLogger(__name__)

class DatabaseSeeder:
    """Database seeding and initial data setup for ERD-compliant schema"""
    
    def __init__(self):
        self.created_objects = {
            'plans': [],
            'shops': [],
            'users': [],
            'categories': [],
            'payment_methods': [],
            'expense_categories': [],
            'products': []
        }

    def verify_database_connection(self):
        return True

    def seed_all(self, include_test_data: bool = False) -> bool:
        """Seed database with all initial data"""
        try:
            logger.info("Starting database seeding...")
            
            # Seed reference data first
            self.seed_plans()
            self.seed_categories()
            self.seed_payment_methods()
            self.seed_expense_categories()

            # Seed test data if requested
            if include_test_data:
                self.seed_users()
                self.seed_shops()
                self.seed_products()

            logger.info("Database seeding completed successfully")
            return True

        except Exception as e:
            logger.error(f"Database seeding failed: {str(e)}")
            return False

    def seed_plans(self) -> bool:
        """Seed subscription plans"""
        plans_data = [
            {
                "name": "Basic",
                "description": "Basic plan for small shops",
                "monthly_price": Decimal("999.00"),
                "quarterly_price": Decimal("2800.00"),
                "yearly_price": Decimal("11000.00"),
                "max_farmers": 10,
                "max_buyers": 20,
                "max_transactions": 500,
                "data_retention_months": 12,
                "record_status": "active"
            }
        ]
        return self._seed_data(Plan, plans_data, 'plans')

    def seed_categories(self) -> bool:
        """Seed product categories"""
        categories_data = [
            {"name": "Grains", "description": "Rice, Wheat, Barley, etc."},
            {"name": "Vegetables", "description": "Fresh vegetables"}
        ]
        return self._seed_data(Category, categories_data, 'categories')

    def seed_payment_methods(self) -> bool:
        """Seed payment methods"""
        payment_methods_data = [
            {"name": "Cash", "description": "Cash payment"},
            {"name": "UPI", "description": "UPI payment"}
        ]
        return self._seed_data(PaymentMethod, payment_methods_data, 'payment_methods')

    def seed_expense_categories(self) -> bool:
        """Seed expense categories"""
        expense_categories_data = [
            {"name": "Transportation", "description": "Vehicle and transport costs"},
            {"name": "Utilities", "description": "Electricity, water, internet"}
        ]
        return self._seed_data(ExpenseCategory, expense_categories_data, 'expense_categories')

    def seed_users(self) -> bool:
        """Seed test users"""
        users_data = [
            {
                "username": "superadmin",
                "password_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
                "role": "superadmin",
                "contact": "+91-9876543210",
                "credit_limit": Decimal("0.00"),
                "record_status": 'active'
            }
        ]
        return self._seed_data(User, users_data, 'users')

    def seed_shops(self) -> bool:
        """Seed test shops"""
        if not self.created_objects['users']:
            logger.warning("Users not seeded, skipping shops")
            return True

        superadmin = next((u for u in self.created_objects['users'] if u.role == UserRole.superadmin), None)
        
        shops_data = [
            {
                "name": "Test Market Center",
                "location": "123 Market Street, Test City",
                "owner_id": superadmin.id if superadmin else None,
                "record_status": 'active'
            }
        ]
        
        result = self._seed_data(Shop, shops_data, 'shops')
        
        # Add shop users
        if result and self.created_objects['shops']:
            shop = self.created_objects['shops'][0]
            shop_users_data = [
                {
                    "username": "owner1",
                    "password_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
                    "role": "owner",
                    "shop_id": shop.id,
                    "contact": "+91-9876543211",
                    "credit_limit": Decimal("10000.00"),
                    "record_status": 'active'
                },
                {
                    "username": "farmer1",
                    "password_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
                    "role": "farmer",
                    "shop_id": shop.id,
                    "contact": "+91-9876543212",
                    "credit_limit": Decimal("5000.00"),
                    "record_status": 'active'
                }
            ]
            self._seed_data(User, shop_users_data, 'users')
        
        return result

    def seed_products(self) -> bool:
        """Seed test products"""
        if not (self.created_objects['shops'] and self.created_objects['categories']):
            logger.warning("Shops or categories not seeded, skipping products")
            return True

        shop = self.created_objects['shops'][0]
        category = self.created_objects['categories'][0]
        
        products_data = [
            {
                "shop_id": shop.id,
                "name": "Basmati Rice",
                "category_id": category.id,
                "price": Decimal("50.00"),
                "record_status": 'active'
            }
        ]
        
        return self._seed_data(Product, products_data, 'products')

    def _seed_data(self, model_class, data_list: List[Dict[str, Any]], object_key: str) -> bool:
        """Generic method to seed data for any model"""
        try:
            with get_db_session() as session:
                created_count = 0
                
                for item_data in data_list:
                    # Check if item already exists
                    if hasattr(model_class, 'name') and 'name' in item_data:
                        existing = session.query(model_class).filter_by(name=item_data['name']).first()
                        if existing:
                            self.created_objects[object_key].append(existing)
                            continue
                    elif hasattr(model_class, 'username') and 'username' in item_data:
                        existing = session.query(model_class).filter_by(username=item_data['username']).first()
                        if existing:
                            self.created_objects[object_key].append(existing)
                            continue
                    
                    # Convert string enums to proper enum values
                    if 'record_status' in item_data and isinstance(item_data['record_status'], str):
                        item_data['record_status'] = RecordStatus(item_data['record_status'])
                    
                    if 'role' in item_data and isinstance(item_data['role'], str) and model_class.__name__ == 'User':
                        item_data['role'] = UserRole(item_data['role'].lower())
                    
                    try:
                        new_item = model_class(**item_data)
                        session.add(new_item)
                        session.flush()
                        
                        self.created_objects[object_key].append(new_item)
                        created_count += 1
                        
                    except IntegrityError as e:
                        logger.warning(f"Skipping duplicate {model_class.__name__}: {e}")
                        session.rollback()
                        continue
                
                session.commit()
                logger.info(f"Seeded {created_count} new {model_class.__name__} records")
                return True
                
        except Exception as e:
            logger.error(f"Error seeding {model_class.__name__}: {str(e)}")
            return False

    def get_seed_summary(self) -> Dict[str, int]:
        """Get summary of seeded data"""
        return {key: len(objects) for key, objects in self.created_objects.items()}


# Global seeder instance
db_seeder = DatabaseSeeder()

# Main execution block
if __name__ == "__main__":
    print("[INFO] Running database seeding...")
    success = db_seeder.seed_all(include_test_data=True)
    if success:
        print("[SUCCESS] Database seeding completed.")
        print(f"[INFO] Summary: {db_seeder.get_seed_summary()}")
    else:
        print("[ERROR] Database seeding failed.")
