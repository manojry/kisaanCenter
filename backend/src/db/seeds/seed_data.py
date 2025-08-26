"""
Database seeding utilities
Provides initial data setup and test data generation
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
    """Database seeding and initial data setup"""
    
    def __init__(self):
        self.created_objects = {
            'users': [],
            'categories': [],
            'plans': [],
            'payment_methods': [],
            'shops': [],
            'products': []
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
            self.seed_categories()
            self.seed_plans()
            self.seed_payment_methods()
            
            # Seed basic operational data
            if include_test_data:
                self.seed_users()
                self.seed_shops()
                self.seed_products()
            
            logger.info("Database seeding completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database seeding failed: {str(e)}")
            return False

    def seed_categories(self) -> bool:
        """Seed product categories"""
        categories_data = [
            {"name": "Grains & Cereals", "description": "Rice, Wheat, Corn, Barley, Oats"},
            {"name": "Pulses & Legumes", "description": "Lentils, Beans, Chickpeas, Peas"},
            {"name": "Vegetables", "description": "Fresh vegetables and leafy greens"},
            {"name": "Fruits", "description": "Fresh and seasonal fruits"},
            {"name": "Spices & Herbs", "description": "Condiments, spices, and herbs"},
            {"name": "Oil Seeds", "description": "Sunflower, Mustard, Sesame seeds"},
            {"name": "Cash Crops", "description": "Cotton, Sugarcane, Tobacco"},
            {"name": "Dairy Products", "description": "Milk, Cheese, Butter products"},
            {"name": "Organic Products", "description": "Certified organic produce"},
            {"name": "Processed Goods", "description": "Value-added processed products"}
        ]
        
        return self._seed_data(Category, categories_data, 'categories')

    def seed_plans(self) -> bool:
        """Seed subscription plans"""
        plans_data = [
            {
                "name": "Basic Plan",
                "description": "Essential features for small farmers and shops",
                "price": Decimal("999.00")
            },
            {
                "name": "Standard Plan",
                "description": "Advanced features for medium-scale operations",
                "price": Decimal("2499.00")
            },
            {
                "name": "Premium Plan",
                "description": "Full-featured plan for large-scale operations",
                "price": Decimal("4999.00")
            },
            {
                "name": "Enterprise Plan",
                "description": "Custom enterprise solutions with dedicated support",
                "price": Decimal("9999.00")
            },
            {
                "name": "Free Trial",
                "description": "30-day free trial for new users",
                "price": Decimal("0.00")
            }
        ]
        
        return self._seed_data(Plan, plans_data, 'plans')

    def seed_payment_methods(self) -> bool:
        """Seed payment methods"""
        payment_methods_data = [
            {"name": "Cash", "description": "Physical cash payment"},
            {"name": "Bank Transfer", "description": "Direct bank account transfer"},
            {"name": "UPI", "description": "Unified Payments Interface"},
            {"name": "Credit Card", "description": "Credit card payments"},
            {"name": "Debit Card", "description": "Debit card payments"},
            {"name": "Digital Wallet", "description": "PayTM, PhonePe, Google Pay"},
            {"name": "Cheque", "description": "Bank cheque payments"},
            {"name": "RTGS/NEFT", "description": "Real-time gross settlement"},
            {"name": "Cryptocurrency", "description": "Digital currency payments"},
            {"name": "Barter System", "description": "Product exchange without money"}
        ]
        
        return self._seed_data(PaymentMethod, payment_methods_data, 'payment_methods')

    def seed_users(self) -> bool:
        """Seed test users with full hierarchy for realistic testing"""
        users_data = [
            # Superadmin
            {
                "name": "Super Admin",
                "email": "admin@kisaancenter.com",
                "phone": "+91-9876543210",
                "role": UserRole.SUPERADMIN,
                "password_hash": "hashed_password_admin",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            },
            # Shop Owner (test owner)
            {
                "name": "Test Owner",
                "email": "owner@test.com",
                "phone": "+91-9000000001",
                "role": UserRole.SHOP_OWNER,
                "password_hash": "hashed_password_owner",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            },
        ]
        # Add multiple employees linked to the owner's shop
        for i in range(1, 4):
            users_data.append({
                "name": f"Employee {i}",
                "email": f"employee{i}@test.com",
                "phone": f"+91-90000000{10+i}",
                "role": UserRole.EMPLOYEE,
                "password_hash": f"hashed_password_employee{i}",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            })
        # Add multiple farmers
        for i in range(1, 4):
            users_data.append({
                "name": f"Farmer {i}",
                "email": f"farmer{i}@test.com",
                "phone": f"+91-90000000{20+i}",
                "role": UserRole.FARMER,
                "password_hash": f"hashed_password_farmer{i}",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            })
        # Add multiple buyers
        for i in range(1, 3):
            users_data.append({
                "name": f"Buyer {i}",
                "email": f"buyer{i}@test.com",
                "phone": f"+91-90000000{30+i}",
                "role": UserRole.BUYER,
                "password_hash": f"hashed_password_buyer{i}",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            })
        return self._seed_data(User, users_data, 'users')

    def seed_shops(self) -> bool:
        """Seed test shop for the test owner and link employees"""
        if not self.created_objects['users']:
            logger.warning("Users not seeded, skipping shops")
            return True
        # Find test owner
        owner = next((u for u in self.created_objects['users'] if getattr(u, 'role', None) == UserRole.SHOP_OWNER), None)
        if not owner:
            logger.warning("No shop owner found, skipping shop creation")
            return True
        shops_data = [
            {
                "name": "Test Owner Shop",
                "owner_user_id": owner.id,
                "address": "100 Main Street, Test City",
                "city": "Test City",
                "state": "Test State",
                "pin_code": "123456",
                "gstin": "27AABCU9603R1ZT",
                "is_verified": True,
                "status": RecordStatus.ACTIVE
            }
        ]
        result = self._seed_data(Shop, shops_data, 'shops')
        # Optionally, link employees to shop via a relationship if your model supports it
        return result

    def seed_products(self) -> bool:
        """Seed test products"""
        if not self.created_objects['categories']:
            logger.warning("Categories not seeded, skipping products")
            return True
        products_data = [
            {
                "name": "Basmati Rice",
                "category_id": self.created_objects['categories'][0].id,
                "description": "Premium quality basmati rice",
                "unit": "kg",
                "status": RecordStatus.ACTIVE
            },
            {
                "name": "Wheat Flour",
                "category_id": self.created_objects['categories'][0].id,
                "description": "Fresh ground wheat flour",
                "unit": "kg",
                "status": RecordStatus.ACTIVE
            },
            {
                "name": "Toor Dal",
                "category_id": self.created_objects['categories'][1].id,
                "description": "Yellow split pigeon peas",
                "unit": "kg",
                "status": RecordStatus.ACTIVE
            },
            {
                "name": "Onions",
                "category_id": self.created_objects['categories'][2].id,
                "description": "Fresh red onions",
                "unit": "kg",
                "status": RecordStatus.ACTIVE
            },
            {
                "name": "Tomatoes",
                "category_id": self.created_objects['categories'][2].id,
                "description": "Fresh ripe tomatoes",
                "unit": "kg",
                "status": RecordStatus.ACTIVE
            }
        ]
        result = self._seed_data(Product, products_data, 'products')
        return result

    def seed_monthly_transactions(self) -> bool:
        """Seed a month's worth of sales and transactions covering all scenarios"""
        from models import Transaction, TransactionStatus, CompletionStatus, Payment, PaymentStatus, FarmerStock, Credit, CreditDetail
        import random
        from decimal import Decimal
        from datetime import datetime, timedelta
        if not (self.created_objects['users'] and self.created_objects['shops'] and self.created_objects['products']):
            logger.warning("Users, shops, or products not seeded, skipping transactions")
            return True
        # Get test owner, shop, employees, farmers, buyers, products
        owner = next((u for u in self.created_objects['users'] if getattr(u, 'role', None) == UserRole.SHOP_OWNER), None)
        shop = self.created_objects['shops'][0] if self.created_objects['shops'] else None
        employees = [u for u in self.created_objects['users'] if getattr(u, 'role', None) == UserRole.EMPLOYEE]
        farmers = [u for u in self.created_objects['users'] if getattr(u, 'role', None) == UserRole.FARMER]
        buyers = [u for u in self.created_objects['users'] if getattr(u, 'role', None) == UserRole.BUYER]
        products = self.created_objects['products']
        if not (owner and shop and employees and farmers and buyers and products):
            logger.warning("Missing required entities for transactions")
            return True
        # Seed daily transactions for the last 30 days
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=30)
        statuses = [TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]
        completion_statuses = [CompletionStatus.PARTIAL, CompletionStatus.FULL]
        payment_statuses = [PaymentStatus.PAID, PaymentStatus.UNPAID, PaymentStatus.PARTIAL]
        payment_methods = self.created_objects['payment_methods']
        try:
            with get_db_session() as session:
                for day in range(31):
                    tx_date = start_date + timedelta(days=day)
                    # For each day, create 2-3 transactions
                    for tx_num in range(random.randint(2, 3)):
                        farmer = random.choice(farmers)
                        buyer = random.choice(buyers)
                        employee = random.choice(employees)
                        product = random.choice(products)
                        quantity = Decimal(random.randint(10, 100))
                        price = Decimal(random.randint(50, 500))
                        status = random.choice(statuses)
                        completion = random.choice(completion_statuses)
                        payment_status = random.choice(payment_statuses)
                        payment_method = random.choice(payment_methods)
                        # Create FarmerStock
                        stock = FarmerStock(
                            farmer_user_id=farmer.id,
                            product_id=product.id,
                            quantity=quantity,
                            price=price,
                            date=tx_date,
                            status=RecordStatus.ACTIVE
                        )
                        session.add(stock)
                        session.flush()
                        # Create Transaction
                        transaction = Transaction(
                            shop_id=shop.id,
                            buyer_user_id=buyer.id,
                            employee_user_id=employee.id,
                            product_id=product.id,
                            quantity=quantity,
                            price=price,
                            status=status,
                            completion_status=completion,
                            payment_status=payment_status,
                            date=tx_date,
                            created_at=tx_date,
                            updated_at=tx_date
                        )
                        session.add(transaction)
                        session.flush()
                        # Create Payment
                        payment = Payment(
                            transaction_id=transaction.id,
                            amount=price * quantity,
                            payment_method_id=payment_method.id,
                            type="buyer_payment",
                            status=RecordStatus.ACTIVE,
                            date=tx_date,
                            created_at=tx_date,
                            updated_at=tx_date
                        )
                        session.add(payment)
                        # Create Credit and CreditDetail
                        credit = Credit(
                            transaction_id=transaction.id,
                            buyer_user_id=buyer.id,
                            amount=price * quantity,
                            status=RecordStatus.ACTIVE,
                            created_at=tx_date,
                            updated_at=tx_date
                        )
                        session.add(credit)
                        session.flush()
                        credit_detail = CreditDetail(
                            credit_id=credit.id,
                            farmer_user_id=farmer.id,
                            product_id=product.id,
                            quantity=quantity,
                            price=price,
                            date=tx_date,
                            created_at=tx_date,
                            updated_at=tx_date
                        )
                        session.add(credit_detail)
                session.commit()
            logger.info("Seeded a month's worth of transactions and sales data.")
            return True
        except Exception as e:
            logger.error(f"Error seeding monthly transactions: {str(e)}")
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
