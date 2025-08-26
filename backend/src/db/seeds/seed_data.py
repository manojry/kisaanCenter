"""
Database seeding utilities
Provides initial data setup and test data generation for ERD-compliant schema
"""

import sys
import os
import logging
from typing import List, Dict, Any
from decimal import Decimal
from datetime import datetime, timedelta

# Add the parent directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import IntegrityError
from models import (
    User, UserRole, Shop, Product, Category, Plan, PaymentMethod,
    RecordStatus, CompletionStatus
)
from connection import get_db_session

logger = logging.getLogger(__name__)

class DatabaseSeeder:
    """Database seeding and initial data setup for ERD-compliant schema"""
    
    def __init__(self):
        self.created_objects = {
            'superadmins': [],
            'plans': [],
            'shops': [],
            'users': [],
            'categories': [],
            'payment_methods': [],
            'expense_categories': [],
            'products': [],
            'farmer_stocks': [],
            'transactions': []
        }

    def seed_all(self, include_test_data: bool = False) -> bool:
        """
        Seed database with all initial data
        
        Args:
            include_test_data: Whether to include test/demo data
        """
        try:
            logger.info("Starting database seeding...")
            
            # Seed reference data first
            self.seed_plans()
            self.seed_categories()
            self.seed_payment_methods()
            self.seed_expense_categories()
            
            # Seed basic operational data
            if include_test_data:
                self.seed_superadmin()
                self.seed_shops()
                self.seed_users()
                self.seed_products()
                self.seed_farmer_stocks()
                self.seed_sample_transactions()
            
            logger.info("Database seeding completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database seeding failed: {str(e)}")
            return False

    def seed_superadmin(self) -> bool:
        """Seed superadmin user"""
        superadmin_data = [{
            "username": "superadmin",
            "password_hash": "hashed_password_superadmin",
            "email": "admin@kisaancenter.com",
            "contact": "+91-9876543210",
            "status": RecordStatus.ACTIVE
        }]
        
        return self._seed_data(Superadmin, superadmin_data, 'superadmins')

    def seed_plans(self) -> bool:
        """Seed subscription plans"""
        plans_data = [
            {
                "name": "Basic",
                "description": "Basic plan for small shops",
                "price": Decimal("999.00"),
                "billing_cycle": "monthly",
                "max_users": 5,
                "max_transactions": 500
            },
            {
                "name": "Standard",
                "description": "Standard plan for growing businesses",
                "price": Decimal("1999.00"),
                "billing_cycle": "monthly",
                "max_users": 15,
                "max_transactions": 2000
            },
            {
                "name": "Premium",
                "description": "Premium plan for large operations",
                "price": Decimal("4999.00"),
                "billing_cycle": "monthly",
                "max_users": 50,
                "max_transactions": 10000
            }
        ]
        
        return self._seed_data(Plan, plans_data, 'plans')

    def seed_categories(self) -> bool:
        """Seed product categories"""
        categories_data = [
            {"name": "Grains", "description": "Rice, Wheat, Barley, etc."},
            {"name": "Vegetables", "description": "Fresh vegetables"},
            {"name": "Fruits", "description": "Fresh fruits"},
            {"name": "Pulses", "description": "Lentils, beans, peas"},
            {"name": "Spices", "description": "Spices and condiments"}
        ]
        
        return self._seed_data(Category, categories_data, 'categories')

    def seed_payment_methods(self) -> bool:
        """Seed payment methods"""
        payment_methods_data = [
            {"name": "Cash", "description": "Cash payment"},
            {"name": "Bank Transfer", "description": "Direct bank transfer"},
            {"name": "UPI", "description": "UPI payment"},
            {"name": "Cheque", "description": "Cheque payment"},
            {"name": "Credit Card", "description": "Credit card payment"}
        ]
        
        return self._seed_data(PaymentMethod, payment_methods_data, 'payment_methods')

    def seed_expense_categories(self) -> bool:
        """Seed expense categories"""
        expense_categories_data = [
            {"name": "Transportation", "description": "Vehicle and transport costs"},
            {"name": "Utilities", "description": "Electricity, water, internet"},
            {"name": "Staff Salary", "description": "Employee salaries"},
            {"name": "Rent", "description": "Shop rent and property costs"},
            {"name": "Maintenance", "description": "Equipment and facility maintenance"}
        ]
        
        return self._seed_data(ExpenseCategory, expense_categories_data, 'expense_categories')

    def seed_shops(self) -> bool:
        """Seed test shops"""
        if not self.created_objects['superadmins'] or not self.created_objects['plans']:
            logger.warning("Superadmins or plans not seeded, skipping shops")
            return True

        superadmin = self.created_objects['superadmins'][0]
        plan = self.created_objects['plans'][0]  # Basic plan
        
        shops_data = [
            {
                "name": "Test Market Center",
                "location": "123 Market Street, Test City",
                "plan_id": plan.id,
                "created_by": superadmin.id,
                "status": RecordStatus.ACTIVE
            }
        ]
        
        return self._seed_data(Shop, shops_data, 'shops')

    def seed_users(self) -> bool:
        """Seed test users with proper roles"""
        if not self.created_objects['shops']:
            logger.warning("Shops not seeded, skipping users")
            return True

        shop = self.created_objects['shops'][0]
        
        users_data = [
            # Shop Owner
            {
                "username": "owner1",
                "password_hash": "hashed_password_owner",
                "role": UserRole.OWNER,
                "shop_id": shop.id,
                "contact": "+91-9000000001",
                "credit_limit": Decimal("0.00"),
                "status": RecordStatus.ACTIVE
            },
            # Farmers
            {
                "username": "farmer1",
                "password_hash": "hashed_password_farmer1",
                "role": UserRole.FARMER,
                "shop_id": shop.id,
                "contact": "+91-9000000002",
                "credit_limit": Decimal("0.00"),
                "status": RecordStatus.ACTIVE
            },
            {
                "username": "farmer2",
                "password_hash": "hashed_password_farmer2",
                "role": UserRole.FARMER,
                "shop_id": shop.id,
                "contact": "+91-9000000003",
                "credit_limit": Decimal("0.00"),
                "status": RecordStatus.ACTIVE
            },
            # Buyers
            {
                "username": "buyer1",
                "password_hash": "hashed_password_buyer1",
                "role": UserRole.BUYER,
                "shop_id": shop.id,
                "contact": "+91-9000000004",
                "credit_limit": Decimal("10000.00"),
                "status": RecordStatus.ACTIVE
            },
            {
                "username": "buyer2",
                "password_hash": "hashed_password_buyer2",
                "role": UserRole.BUYER,
                "shop_id": shop.id,
                "contact": "+91-9000000005",
                "credit_limit": Decimal("5000.00"),
                "status": RecordStatus.ACTIVE
            },
            # Employee
            {
                "username": "employee1",
                "password_hash": "hashed_password_employee1",
                "role": UserRole.EMPLOYEE,
                "shop_id": shop.id,
                "contact": "+91-9000000006",
                "credit_limit": Decimal("0.00"),
                "status": RecordStatus.ACTIVE
            }
        ]
        
        return self._seed_data(User, users_data, 'users')

    def seed_products(self) -> bool:
        """Seed test products"""
        if not (self.created_objects['shops'] and self.created_objects['categories']):
            logger.warning("Shops or categories not seeded, skipping products")
            return True

        shop = self.created_objects['shops'][0]
        
        products_data = [
            {
                "shop_id": shop.id,
                "name": "Basmati Rice",
                "category_id": self.created_objects['categories'][0].id,
                "status": RecordStatus.ACTIVE
            },
            {
                "shop_id": shop.id,
                "name": "Wheat",
                "category_id": self.created_objects['categories'][0].id,
                "status": RecordStatus.ACTIVE
            },
            {
                "shop_id": shop.id,
                "name": "Tomatoes",
                "category_id": self.created_objects['categories'][1].id,
                "status": RecordStatus.ACTIVE
            },
            {
                "shop_id": shop.id,
                "name": "Onions",
                "category_id": self.created_objects['categories'][1].id,
                "status": RecordStatus.ACTIVE
            },
            {
                "shop_id": shop.id,
                "name": "Apples",
                "category_id": self.created_objects['categories'][2].id,
                "status": RecordStatus.ACTIVE
            }
        ]
        
        return self._seed_data(Product, products_data, 'products')

    def seed_monthly_transactions(self) -> bool:
        """Seed a month's worth of sales and transactions covering all scenarios"""
        from models import Transaction, TransactionStatus, CompletionStatus, Payment, PaymentStatus, FarmerStock, Credit, CreditDetail
        import random
        from decimal import Decimal
        from datetime import datetime, timedelta
        if not (self.created_objects['users'] and self.created_objects['shops'] and self.created_objects['products']):
            logger.warning("Users, shops, or products not seeded, skipping transactions")
            return True

        shop = self.created_objects['shops'][0]
        farmers = [u for u in self.created_objects['users'] if u.role == UserRole.FARMER]
        products = self.created_objects['products']
        
        if not farmers:
            logger.warning("No farmers found, skipping farmer stocks")
            return True

        farmer_stocks_data = []
        for farmer in farmers:
            for product in products[:3]:  # Each farmer brings 3 different products
                farmer_stocks_data.append({
                    "shop_id": shop.id,
                    "farmer_user_id": farmer.id,
                    "product_id": product.id,
                    "quantity": Decimal(str(50 + (farmer.id * 10))),  # Different quantities
                    "status": StockStatus.ACTIVE,
                    "date": date.today()
                })
        
        return self._seed_data(FarmerStock, farmer_stocks_data, 'farmer_stocks')

    def seed_sample_transactions(self) -> bool:
        """Seed sample transactions"""
        if not (self.created_objects['users'] and self.created_objects['farmer_stocks']):
            logger.warning("Users or farmer stocks not seeded, skipping transactions")
            return True

        shop = self.created_objects['shops'][0]
        buyers = [u for u in self.created_objects['users'] if u.role == UserRole.BUYER]
        farmer_stocks = self.created_objects['farmer_stocks']
        
        if not (buyers and farmer_stocks):
            logger.warning("No buyers or farmer stocks found, skipping transactions")
            return True

        try:
            with get_db_session() as session:
                for i, buyer in enumerate(buyers):
                    # Create a transaction for each buyer
                    stock = farmer_stocks[i % len(farmer_stocks)]
                    quantity = Decimal("10.00")
                    price = Decimal("100.00")
                    total_amount = quantity * price
                    
                    transaction = Transaction(
                        shop_id=shop.id,
                        buyer_user_id=buyer.id,
                        type=TransactionType.SALE,
                        status=TransactionStatus.ACTIVE,
                        commission_rate=Decimal("10.00"),
                        commission_amount=total_amount * Decimal("0.10"),
                        payment_status=PaymentStatus.PENDING,
                        buyer_paid_amount=Decimal("0.00"),
                        farmer_paid_amount=Decimal("0.00"),
                        commission_confirmed=False,
                        completion_status=CompletionStatus.PENDING,
                        date=date.today()
                    )
                    session.add(transaction)
                    session.flush()
                    
                    # Create transaction item
                    transaction_item = TransactionItem(
                        transaction_id=transaction.id,
                        product_id=stock.product_id,
                        farmer_stock_id=stock.id,
                        quantity=quantity,
                        price=price,
                        status=RecordStatus.ACTIVE
                    )
                    session.add(transaction_item)
                    
                    self.created_objects['transactions'].append(transaction)
                
                session.commit()
                logger.info(f"Seeded {len(buyers)} sample transactions")
                return True
                
        except Exception as e:
            logger.error(f"Error seeding transactions: {str(e)}")
            return False

    def _seed_data(self, model_class, data_list: List[Dict[str, Any]], object_key: str) -> bool:
        """Generic method to seed data for any model"""
        try:
            with get_db_session() as session:
                created_count = 0
                
                for item_data in data_list:
                    # Check if item already exists
                    if hasattr(model_class, 'name'):
                        existing = session.query(model_class).filter_by(name=item_data['name']).first()
                        if existing:
                            logger.debug(f"{model_class.__name__} '{item_data['name']}' already exists")
                            self.created_objects[object_key].append(existing)
                            continue
                    
                    # Create new item
                    try:
                        new_item = model_class(**item_data)
                        session.add(new_item)
                        session.flush()  # To get the ID
                        
                        self.created_objects[object_key].append(new_item)
                        created_count += 1
                        logger.debug(f"Created {model_class.__name__}: {item_data.get('name', 'Unknown')}")
                        
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

    def clear_all_data(self, confirm: bool = False) -> bool:
        """
        Clear all seeded data (USE WITH CAUTION)
        
        Args:
            confirm: Must be True to actually clear data
        """
        if not confirm:
            logger.warning("clear_all_data called without confirmation")
            return False
            
        try:
            logger.warning("CLEARING ALL SEEDED DATA...")
            
            with get_db_session() as session:
                # Clear in reverse order to maintain referential integrity
                models_to_clear = [Product, Shop, User, PaymentMethod, Plan, Category]
                
                for model_class in models_to_clear:
                    count = session.query(model_class).count()
                    session.query(model_class).delete()
                    logger.info(f"Cleared {count} {model_class.__name__} records")
                
                session.commit()
                
            # Clear tracking
            for key in self.created_objects:
                self.created_objects[key] = []
                
            logger.warning("All seeded data cleared")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing seeded data: {str(e)}")
            return False

    def get_seed_summary(self) -> Dict[str, int]:
        """Get summary of seeded data"""
        return {
            key: len(objects) for key, objects in self.created_objects.items()
        }

    def seed_all(self, include_test_data: bool = False) -> bool:
        """Seed all data in correct order"""
        if not self.verify_database_connection():
            return False
        
        seed_methods = [
            ('superadmins', self.seed_superadmins),
            ('plans', self.seed_plans),
            ('categories', self.seed_categories),
            ('payment_methods', self.seed_payment_methods),
            ('expense_categories', self.seed_expense_categories),
            ('shops', self.seed_shops),
            ('users', self.seed_users),
            ('products', self.seed_products),
        ]
        
        if include_test_data:
            seed_methods.extend([
                ('farmer_stocks', self.seed_farmer_stocks),
                ('transactions', self.seed_sample_transactions),
            ])
        
        for name, method in seed_methods:
            logger.info(f"Seeding {name}...")
            if not method():
                logger.error(f"Failed to seed {name}")
                return False
            logger.info(f"Successfully seeded {name}")
        
        logger.info("All seeding completed successfully")
        return True


# Global seeder instance
db_seeder = DatabaseSeeder()


# Convenience functions
def seed_all_data(include_test_data: bool = False) -> bool:
    """
    Seed database with all initial data
    Args:
        include_test_data: Whether to include test/demo data
    """
    try:
        logger.info("Starting database seeding...")
        
        # Seed reference data first
        db_seeder.seed_categories()
        db_seeder.seed_plans()
        db_seeder.seed_payment_methods()
        
        # Seed basic operational data
        if include_test_data:
            db_seeder.seed_users()
            db_seeder.seed_shops()
            db_seeder.seed_products()
            db_seeder.seed_monthly_transactions()
            
        logger.info("Database seeding completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database seeding failed: {str(e)}")
        return False
