
"""
Seed Script: 006 - Payment Records
Purpose: Seeds farmer payments and buyer credit records
Usage: python -m src.db.seeds.seed_006_payment_records
Dependencies: All previous seed scripts
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import FarmerPayment, BuyerCredit, User, Shop, Transaction, UserRole
from src.core.enums import RecordStatus
from datetime import datetime, date, timedelta
from decimal import Decimal

def seed_payment_records():
    """Seed farmer payments and buyer credit records"""
    print("🌱 Seeding Payment Records...")
    
    try:
        with get_db_session() as db:
            # Get reference data
            farmers = db.query(User).filter_by(role=UserRole.FARMER).all()
            buyers = db.query(User).filter_by(role=UserRole.BUYER).all()
            shops = db.query(Shop).all()
            transactions = db.query(Transaction).all()
            
            if not all([farmers, buyers, shops, transactions]):
                print("  ⚠️  Missing reference data. Please run previous seed scripts first.")
                return False
            
            # Farmer Payment Records
            farmer_payments = [
                {
                    "farmer": farmers[0],  # Ramesh Patel
                    "shop": shops[0],     # Green Valley
                    "amount": Decimal("285.0"),
                    "date": date.today() - timedelta(days=5),
                    "payment_method": "cash",
                    "notes": "Payment for tomato sales",
                    "approved": True
                },
                {
                    "farmer": farmers[0],  # Ramesh Patel
                    "shop": shops[0],     # Green Valley
                    "amount": Decimal("142.5"),
                    "date": date.today() - timedelta(days=2),
                    "payment_method": "bank_transfer",
                    "notes": "Partial payment for potato sales",
                    "approved": True
                },
                {
                    "farmer": farmers[1] if len(farmers) > 1 else farmers[0],  # Sunita Devi
                    "shop": shops[0],     # Green Valley
                    "amount": Decimal("475.0"),
                    "date": date.today() - timedelta(days=1),
                    "payment_method": "upi",
                    "notes": "Payment for onion sales",
                    "approved": False  # Pending approval
                }
            ]
            
            for payment_data in farmer_payments:
                # Check if payment already exists
                existing_payment = db.query(FarmerPayment).filter_by(
                    farmer_user_id=payment_data["farmer"].id,
                    shop_id=payment_data["shop"].id,
                    amount=payment_data["amount"],
                    date=payment_data["date"]
                ).first()
                
                if not existing_payment:
                    farmer_payment = FarmerPayment(
                        farmer_user_id=payment_data["farmer"].id,
                        shop_id=payment_data["shop"].id,
                        amount=payment_data["amount"],
                        date=payment_data["date"],
                        payment_method=payment_data["payment_method"],
                        notes=payment_data["notes"],
                        approved_by=shops[0].owner_id if payment_data["approved"] else None,
                        approved_at=datetime.utcnow() if payment_data["approved"] else None,
                        status=RecordStatus.ACTIVE,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(farmer_payment)
                    status = "✅ Approved" if payment_data["approved"] else "⏳ Pending"
                    print(f"  {status} farmer payment: {payment_data['farmer'].name} - ₹{payment_data['amount']}")
            
            # Buyer Credit Records
            buyer_credits = [
                {
                    "buyer": buyers[0],   # Amit Wholesaler
                    "shop": shops[0],     # Green Valley
                    "credit_limit": Decimal("50000.0"),
                    "current_balance": Decimal("250.0"),  # Outstanding from partial payment
                    "last_transaction_date": date.today() - timedelta(days=3)
                },
                {
                    "buyer": buyers[1] if len(buyers) > 1 else buyers[0],  # Neha Retailer
                    "shop": shops[0],     # Green Valley
                    "credit_limit": Decimal("25000.0"),
                    "current_balance": Decimal("0.0"),    # No outstanding
                    "last_transaction_date": date.today() - timedelta(days=5)
                }
            ]
            
            for credit_data in buyer_credits:
                # Check if credit record already exists
                existing_credit = db.query(BuyerCredit).filter_by(
                    buyer_user_id=credit_data["buyer"].id,
                    shop_id=credit_data["shop"].id
                ).first()
                
                if not existing_credit:
                    buyer_credit = BuyerCredit(
                        buyer_user_id=credit_data["buyer"].id,
                        shop_id=credit_data["shop"].id,
                        credit_limit=credit_data["credit_limit"],
                        current_balance=credit_data["current_balance"],
                        last_transaction_date=credit_data["last_transaction_date"],
                        status=RecordStatus.ACTIVE,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(buyer_credit)
                    print(f"  💳 Created credit record: {credit_data['buyer'].name} - Limit: ₹{credit_data['credit_limit']}, Balance: ₹{credit_data['current_balance']}")
            
            db.commit()
            print("✅ Payment records seeded successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error seeding payment records: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return False

if __name__ == "__main__":
    seed_payment_records()
