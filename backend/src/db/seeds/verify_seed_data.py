
"""
Verify Seed Data Script
Purpose: Verifies that all seed data was created correctly
Usage: python -m src.db.seeds.verify_seed_data
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
    AuditLog, Notification, UserRole
)

def verify_seed_data():
    """Verify that all seed data was created correctly"""
    print("🔍 Verifying Seed Data...")
    print("=" * 50)
    
    try:
        with get_db_session() as db:
            verification_results = []
            
            # Check basic reference data
            categories_count = db.query(Category).count()
            units_count = db.query(Unit).count()
            plans_count = db.query(Plan).count()
            
            verification_results.append(("Categories", categories_count, 3, categories_count >= 3))
            verification_results.append(("Units", units_count, 3, units_count >= 3))
            verification_results.append(("Plans", plans_count, 3, plans_count >= 3))
            
            # Check users by role
            admin_count = db.query(User).filter_by(role=UserRole.SUPERADMIN).count()
            shop_owner_count = db.query(User).filter_by(role=UserRole.SHOP_OWNER).count()
            farmer_count = db.query(User).filter_by(role=UserRole.FARMER).count()
            buyer_count = db.query(User).filter_by(role=UserRole.BUYER).count()
            
            verification_results.append(("Superadmin Users", admin_count, 1, admin_count >= 1))
            verification_results.append(("Shop Owner Users", shop_owner_count, 1, shop_owner_count >= 1))
            verification_results.append(("Farmer Users", farmer_count, 2, farmer_count >= 2))
            verification_results.append(("Buyer Users", buyer_count, 2, buyer_count >= 2))
            
            # Check shops and products
            shops_count = db.query(Shop).count()
            products_count = db.query(Product).count()
            
            verification_results.append(("Shops", shops_count, 1, shops_count >= 1))
            verification_results.append(("Products", products_count, 5, products_count >= 5))
            
            # Check transactions and related data
            transactions_count = db.query(Transaction).count()
            transaction_items_count = db.query(TransactionItem).count()
            farmer_stock_count = db.query(FarmerStock).count()
            
            verification_results.append(("Transactions", transactions_count, 3, transactions_count >= 3))
            verification_results.append(("Transaction Items", transaction_items_count, 5, transaction_items_count >= 5))
            verification_results.append(("Farmer Stock Records", farmer_stock_count, 5, farmer_stock_count >= 5))
            
            # Check commission and payment data
            commission_rules_count = db.query(CommissionRule).count()
            farmer_payments_count = db.query(FarmerPayment).count()
            buyer_credits_count = db.query(BuyerCredit).count()
            
            verification_results.append(("Commission Rules", commission_rules_count, 3, commission_rules_count >= 3))
            verification_results.append(("Farmer Payments", farmer_payments_count, 2, farmer_payments_count >= 2))
            verification_results.append(("Buyer Credits", buyer_credits_count, 2, buyer_credits_count >= 2))
            
            # Check audit logs and notifications
            audit_logs_count = db.query(AuditLog).count()
            notifications_count = db.query(Notification).count()
            
            verification_results.append(("Audit Logs", audit_logs_count, 4, audit_logs_count >= 4))
            verification_results.append(("Notifications", notifications_count, 8, notifications_count >= 8))
            
            # Display results
            print("\n📊 Verification Results:")
            print("-" * 60)
            all_passed = True
            
            for name, actual, expected, passed in verification_results:
                status = "✅" if passed else "❌"
                print(f"{status} {name:<25} | Expected: {expected:>3} | Actual: {actual:>3}")
                if not passed:
                    all_passed = False
            
            print("-" * 60)
            
            if all_passed:
                print("🎉 All verifications passed! Seed data is complete.")
                
                # Additional integrity checks
                print("\n🔍 Additional Integrity Checks:")
                
                # Check if transactions have items
                transactions_with_items = db.query(Transaction).join(TransactionItem).count()
                print(f"✅ Transactions with items: {transactions_with_items}")
                
                # Check if farmers have stock
                farmers_with_stock = db.query(User).filter_by(role=UserRole.FARMER).join(FarmerStock).count()
                print(f"✅ Farmers with stock: {farmers_with_stock}")
                
                # Check if shops have commission rules
                shops_with_rules = db.query(Shop).join(CommissionRule).count()
                print(f"✅ Shops with commission rules: {shops_with_rules}")
                
                print("\n🎯 Sample Login Credentials:")
                admin_user = db.query(User).filter_by(role=UserRole.SUPERADMIN).first()
                shop_owner = db.query(User).filter_by(role=UserRole.SHOP_OWNER).first()
                farmer = db.query(User).filter_by(role=UserRole.FARMER).first()
                buyer = db.query(User).filter_by(role=UserRole.BUYER).first()
                
                if admin_user:
                    print(f"   Admin: {admin_user.email}")
                if shop_owner:
                    print(f"   Shop Owner: {shop_owner.email}")
                    print(f"   Shop Owner: {shop_owner.email}")
                if farmer:
                    print(f"   Farmer: {farmer.email}")
                if buyer:
                    print(f"   Buyer: {buyer.email}")
                
                return True
            else:
                print("❌ Some verifications failed. Please check the seed data.")
                print("\n💡 Troubleshooting:")
                print("   1. Run cleanup script: python -m src.db.seeds.cleanup_seed_data")
                print("   2. Re-run seeding: python -m src.db.seeds.run_complete_seeding")
                print("   3. Check database constraints and foreign keys")
                return False
                
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        print("\n💡 Possible issues:")
        print("   1. Database connection problems")
        print("   2. Missing tables (run migrations first)")
        print("   3. Import errors in models")
        return False

def verify_data_relationships():
    """Verify data relationships and constraints"""
    print("\n🔗 Verifying Data Relationships...")
    print("-" * 40)
    
    try:
        with get_db_session() as db:
            relationship_checks = []
            
            # Check transaction-shop relationships
            transactions_with_valid_shops = db.query(Transaction).join(Shop).count()
            total_transactions = db.query(Transaction).count()
            relationship_checks.append(("Transaction-Shop", transactions_with_valid_shops, total_transactions))
            
            # Check transaction-buyer relationships
            transactions_with_valid_buyers = db.query(Transaction).join(User, Transaction.buyer_id == User.id).count()
            relationship_checks.append(("Transaction-Buyer", transactions_with_valid_buyers, total_transactions))
            
            # Check farmer stock-product relationships
            stock_with_valid_products = db.query(FarmerStock).join(Product).count()
            total_stock = db.query(FarmerStock).count()
            relationship_checks.append(("Stock-Product", stock_with_valid_products, total_stock))
            
            # Check commission rules-shop relationships
            rules_with_valid_shops = db.query(CommissionRule).join(Shop).count()
            total_rules = db.query(CommissionRule).count()
            relationship_checks.append(("Rules-Shop", rules_with_valid_shops, total_rules))
            
            all_relationships_valid = True
            for name, valid_count, total_count in relationship_checks:
                if valid_count == total_count and total_count > 0:
                    print(f"✅ {name}: {valid_count}/{total_count}")
                else:
                    print(f"❌ {name}: {valid_count}/{total_count}")
                    all_relationships_valid = False
            
            return all_relationships_valid
            
    except Exception as e:
        print(f"❌ Error verifying relationships: {str(e)}")
        return False

def generate_summary_report():
    """Generate a comprehensive summary report"""
    print("\n📋 Database Summary Report")
    print("=" * 50)
    
    try:
        with get_db_session() as db:
            # User statistics
            print("👥 User Statistics:")
            for role in UserRole:
                count = db.query(User).filter_by(role=role).count()
                print(f"   {role.value.title()}: {count}")
            
            # Business data statistics
            print("\n🏪 Business Data:")
            shops_count = db.query(Shop).count()
            products_count = db.query(Product).count()
            categories_count = db.query(Category).count()
            print(f"   Shops: {shops_count}")
            print(f"   Products: {products_count}")
            print(f"   Categories: {categories_count}")
            
            # Transaction statistics
            print("\n💰 Transaction Data:")
            transactions_count = db.query(Transaction).count()
            completed_transactions = db.query(Transaction).filter_by(completion_status='completed').count()
            total_transaction_value = db.query(Transaction).with_entities(
                db.func.sum(Transaction.total_amount)
            ).scalar() or 0
            
            print(f"   Total Transactions: {transactions_count}")
            print(f"   Completed: {completed_transactions}")
            print(f"   Total Value: ₹{total_transaction_value:.2f}")
            
            # Payment statistics
            print("\n💳 Payment Data:")
            farmer_payments_count = db.query(FarmerPayment).count()
            approved_payments = db.query(FarmerPayment).filter(FarmerPayment.approved_by.isnot(None)).count()
            total_payments_value = db.query(FarmerPayment).with_entities(
                db.func.sum(FarmerPayment.amount)
            ).scalar() or 0
            
            print(f"   Farmer Payments: {farmer_payments_count}")
            print(f"   Approved: {approved_payments}")
            print(f"   Total Paid: ₹{total_payments_value:.2f}")
            
            # Stock statistics
            print("\n📦 Stock Data:")
            stock_records = db.query(FarmerStock).count()
            active_stock = db.query(FarmerStock).filter_by(status='active').count()
            print(f"   Stock Records: {stock_records}")
            print(f"   Active Records: {active_stock}")
            
            # System statistics
            print("\n🔔 System Data:")
            notifications_count = db.query(Notification).count()
            unread_notifications = db.query(Notification).filter_by(status='unread').count()
            audit_logs_count = db.query(AuditLog).count()
            
            print(f"   Notifications: {notifications_count}")
            print(f"   Unread: {unread_notifications}")
            print(f"   Audit Logs: {audit_logs_count}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error generating summary: {str(e)}")
        return False

def full_verification():
    """Run complete verification suite"""
    print("🚀 KisaanCenter Database Verification Suite")
    print("=" * 60)
    
    # Step 1: Basic data verification
    basic_verification = verify_seed_data()
    
    # Step 2: Relationship verification
    relationship_verification = verify_data_relationships()
    
    # Step 3: Generate summary
    summary_generated = generate_summary_report()
    
    print("\n" + "=" * 60)
    if basic_verification and relationship_verification and summary_generated:
        print("🎉 All verifications passed! Database is ready for use.")
        print("\n🚀 Ready to start the application:")
        print("   Backend: uvicorn src.main:app --reload")
        print("   Frontend: npm run dev")
    else:
        print("❌ Some verifications failed. Please review the issues above.")
        print("\n🔧 Recommended actions:")
        print("   1. Check error messages above")
        print("   2. Run cleanup and re-seed if necessary")
        print("   3. Verify database schema matches models")
    
    return basic_verification and relationship_verification

if __name__ == "__main__":
    success = full_verification()
    sys.exit(0 if success else 1)
