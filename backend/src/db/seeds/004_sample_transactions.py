
"""
Seed Script: 004 - Sample Transactions
Purpose: Seeds sample transactions with various payment scenarios
Usage: python -m src.db.seeds.004_sample_transactions
Dependencies: 001_basic_reference_data.py, 002_sample_users_and_shops.py, 003_products_and_stock.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import Transaction, TransactionItem, User, Shop, Product, FarmerStock, UserRole
from src.core.enums import TransactionStatus, PaymentStatus, CompletionStatus, RecordStatus
from datetime import datetime, date, timedelta
from decimal import Decimal

def seed_sample_transactions():
    """Seed sample transactions with various payment scenarios"""
    print("🌱 Seeding Sample Transactions...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            buyers = db.query(User).filter_by(role=UserRole.BUYER).all()
            farmers = db.query(User).filter_by(role=UserRole.FARMER).all()
            shops = db.query(Shop).all()
            products = db.query(Product).all()
            farmer_stocks = db.query(FarmerStock).all()
            
            if not all([buyers, farmers, shops, products, farmer_stocks]):
                print("  ⚠️  Missing reference data. Please run previous seed scripts first.")
                return False
            
            # Sample transactions with different payment scenarios
            transaction_scenarios = [
                {
                    "description": "Fully paid transaction",
                    "buyer": buyers[0],
                    "shop": shops[0],
                    "date": date.today() - timedelta(days=5),
                    "commission_rate": Decimal("5.0"),
                    "items": [
                        {
                            "farmer": farmers[0],
                            "product": products[0],  # Tomato
                            "quantity": Decimal("10.0"),
                            "price": Decimal("30.0")
                        }
                    ],
                    "buyer_paid_amount": Decimal("300.0"),  # Full payment
                    "farmer_paid_amount": Decimal("285.0"),  # Full payment (300 - 15 commission)
                    "commission_paid_amount": Decimal("15.0")  # Full commission
                },
                {
                    "description": "Buyer paid half, farmer unpaid",
                    "buyer": buyers[1] if len(buyers) > 1 else buyers[0],
                    "shop": shops[0],
                    "date": date.today() - timedelta(days=3),
                    "commission_rate": Decimal("4.5"),
                    "items": [
                        {
                            "farmer": farmers[1] if len(farmers) > 1 else farmers[0],
                            "product": products[1],  # Onion
                            "quantity": Decimal("20.0"),
                            "price": Decimal("25.0")
                        }
                    ],
                    "buyer_paid_amount": Decimal("250.0"),  # Half payment (500/2)
                    "farmer_paid_amount": Decimal("0.0"),   # No payment
                    "commission_paid_amount": Decimal("0.0")  # No commission
                },
                {
                    "description": "Farmer paid half, buyer fully paid",
                    "buyer": buyers[0],
                    "shop": shops[0],
                    "date": date.today() - timedelta(days=2),
                    "commission_rate": Decimal("5.0"),
                    "items": [
                        {
                            "farmer": farmers[0],
                            "product": products[2],  # Potato
                            "quantity": Decimal("15.0"),
                            "price": Decimal("20.0")
                        }
                    ],
                    "buyer_paid_amount": Decimal("300.0"),  # Full payment
                    "farmer_paid_amount": Decimal("142.5"), # Half payment (285/2)
                    "commission_paid_amount": Decimal("15.0")  # Full commission
                },
                {
                    "description": "No payments made",
                    "buyer": buyers[0],
                    "shop": shops[0],
                    "date": date.today() - timedelta(days=1),
                    "commission_rate": Decimal("6.0"),
                    "items": [
                        {
                            "farmer": farmers[0],
                            "product": products[3],  # Carrot
                            "quantity": Decimal("25.0"),
                            "price": Decimal("15.0")
                        }
                    ],
                    "buyer_paid_amount": Decimal("0.0"),   # No payment
                    "farmer_paid_amount": Decimal("0.0"),   # No payment
                    "commission_paid_amount": Decimal("0.0")  # No commission
                }
            ]
            
            # Create transactions
            for scenario in transaction_scenarios:
                # Calculate total amount
                total_amount = sum(item["quantity"] * item["price"] for item in scenario["items"])
                commission_amount = total_amount * (scenario["commission_rate"] / 100)
                farmer_amount = total_amount - commission_amount
                
                # Create transaction
                transaction = Transaction(
                    buyer_id=scenario["buyer"].id,
                    shop_id=scenario["shop"].id,
                    transaction_date=scenario["date"],
                    total_amount=total_amount,
                    commission_rate=scenario["commission_rate"],
                    commission_amount=commission_amount,
                    farmer_amount=farmer_amount,
                    buyer_paid_amount=scenario["buyer_paid_amount"],
                    farmer_paid_amount=scenario["farmer_paid_amount"],
                    commission_paid_amount=scenario["commission_paid_amount"],
                    status=TransactionStatus.COMPLETED,
                    payment_status=PaymentStatus.PARTIALLY_PAID if (
                        scenario["buyer_paid_amount"] < total_amount or 
                        scenario["farmer_paid_amount"] < farmer_amount
                    ) else PaymentStatus.FULLY_PAID,
                    completion_status=CompletionStatus.COMPLETED,
                    record_status=RecordStatus.ACTIVE
                )
                
                db.add(transaction)
                db.flush()  # Get transaction ID
                
                # Create transaction items
                for item in scenario["items"]:
                    transaction_item = TransactionItem(
                        transaction_id=transaction.id,
                        farmer_id=item["farmer"].id,
                        product_id=item["product"].id,
                        quantity=item["quantity"],
                        unit_price=item["price"],
                        total_price=item["quantity"] * item["price"],
                        record_status=RecordStatus.ACTIVE
                    )
                    db.add(transaction_item)
                
                print(f"  ✓ Created transaction: {scenario['description']}")
            
            db.commit()
            print("✅ Sample transactions seeded successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding sample transactions: {str(e)}")
        return False

if __name__ == "__main__":
    seed_sample_transactions()
