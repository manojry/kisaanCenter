
"""
Cleanup Seed Data Script
Purpose: Removes all seeded data for fresh start
Usage: python -m src.db.seeds.cleanup_seed_data
WARNING: This will delete all data from the database!
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from sqlalchemy.orm import Session
from src.database import get_db_session
from src.models import (
    User, Shop, Product, Category, Unit, Plan,
    Transaction, TransactionItem, FarmerStock,
    FarmerPayment, BuyerCredit, CommissionRule,
    AuditLog, Notification
)

def cleanup_seed_data():
    """Remove all seeded data from database"""
    print("🧹 Cleaning up seed data...")
    print("⚠️  WARNING: This will delete ALL data from the database!")
    
    # Ask for confirmation
    confirm = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cleanup cancelled.")
        return False
    
    try:
        with get_db_session() as db:
            # Delete in reverse dependency order
            tables_to_clean = [
                ("Notifications", Notification),
                ("Audit Logs", AuditLog),
                ("Commission Rules", CommissionRule),
                ("Buyer Credits", BuyerCredit),
                ("Farmer Payments", FarmerPayment),
                ("Farmer Stock", FarmerStock),
                ("Transaction Items", TransactionItem),
                ("Transactions", Transaction),
                ("Products", Product),
                ("Shops", Shop),
                ("Users", User),
                ("Categories", Category),
                ("Units", Unit),
                ("Plans", Plan)
            ]
            
            for table_name, model_class in tables_to_clean:
                try:
                    count = db.query(model_class).count()
                    if count > 0:
                        db.query(model_class).delete()
                        print(f"  🗑️  Deleted {count} records from {table_name}")
                    else:
                        print(f"  ✅ {table_name} already empty")
                except Exception as e:
                    print(f"  ⚠️  Error cleaning {table_name}: {str(e)}")
            
            db.commit()
            print("✅ Database cleanup completed successfully!")
            print("\n📊 All tables are now empty and ready for fresh seeding.")
            return True
            
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return False

def reset_sequences():
    """Reset auto-increment sequences for fresh start"""
    print("🔄 Resetting database sequences...")
    
    try:
        with get_db_session() as db:
            # Reset sequences for PostgreSQL
            sequences = [
                'users_id_seq',
                'shops_id_seq',
                'products_id_seq',
                'categories_id_seq',
                'units_id_seq',
                'plans_id_seq',
                'transactions_id_seq',
                'transaction_items_id_seq',
                'farmer_stock_id_seq',
                'farmer_payments_id_seq',
                'buyer_credits_id_seq',
                'commission_rules_id_seq',
                'audit_logs_id_seq',
                'notifications_id_seq'
            ]
            
            for seq in sequences:
                try:
                    db.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
                    print(f"  🔄 Reset sequence: {seq}")
                except Exception as e:
                    print(f"  ⚠️  Could not reset {seq}: {str(e)}")
            
            db.commit()
            print("✅ Sequences reset completed!")
            return True
            
    except Exception as e:
        print(f"❌ Error resetting sequences: {str(e)}")
        return False

def full_cleanup():
    """Perform complete cleanup including sequences"""
    print("🚀 KisaanCenter Database Full Cleanup")
    print("=" * 50)
    
    # Step 1: Cleanup data
    if not cleanup_seed_data():
        return False
    
    # Step 2: Reset sequences
    if not reset_sequences():
        print("⚠️  Sequences reset failed, but data cleanup was successful")
    
    print("\n🎉 Full cleanup completed!")
    print("📝 Database is now ready for fresh seeding.")
    print("\n💡 Next steps:")
    print("   1. Run: python -m src.db.seeds.run_complete_seeding")
    print("   2. Or run individual seed scripts as needed")
    
    return True

if __name__ == "__main__":
    success = full_cleanup()
    sys.exit(0 if success else 1)
