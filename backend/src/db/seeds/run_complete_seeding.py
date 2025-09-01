
"""
Complete Database Seeding Script
Purpose: Runs all seed scripts including new ones in the correct order
Usage: python -m src.db.seeds.run_complete_seeding
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from src.db.seeds.seed_001_basic_reference_data import seed_basic_reference_data
from src.db.seeds.seed_002_sample_users_and_shops import seed_sample_users_and_shops
from src.db.seeds.seed_003_products_and_stock import seed_products_and_stock
from src.db.seeds.seed_004_sample_transactions import seed_sample_transactions
from src.db.seeds.seed_005_commission_rules import seed_commission_rules
from src.db.seeds.seed_006_payment_records import seed_payment_records
from src.db.seeds.seed_007_audit_logs import seed_audit_logs
from src.db.seeds.seed_008_notifications import seed_notifications

def run_complete_seeding():
    """Run all seed scripts in the correct order"""
    print("🚀 KisaanCenter Complete Database Seeding")
    print("=" * 70)
    
    seed_functions = [
        ("001 - Basic Reference Data", seed_basic_reference_data),
        ("002 - Sample Users and Shops", seed_sample_users_and_shops),
        ("003 - Products and Stock", seed_products_and_stock),
        ("004 - Sample Transactions", seed_sample_transactions),
        ("005 - Commission Rules", seed_commission_rules),
        ("006 - Payment Records", seed_payment_records),
        ("007 - Audit Logs", seed_audit_logs),
        ("008 - Notifications", seed_notifications)
    ]
    
    success_count = 0
    failed_scripts = []
    
    for name, seed_func in seed_functions:
        print(f"\n📦 Running: {name}")
        print("-" * 50)
        try:
            result = seed_func()
            if result:
                success_count += 1
                print(f"✅ {name} completed successfully")
            else:
                print(f"❌ {name} failed")
                failed_scripts.append(name)
        except Exception as e:
            print(f"❌ {name} failed with error: {str(e)}")
            failed_scripts.append(name)
    
    print("\n" + "=" * 70)
    if success_count == len(seed_functions):
        print("🎉 All seed scripts completed successfully!")
        print("\n📊 Complete Sample Data Created:")
        print("   • ✅ Categories, Units, Plans")
        print("   • ✅ Users (Admin, Shop Owners, Farmers, Buyers)")
        print("   • ✅ Shops with commission rates")
        print("   • ✅ Products with farmer stock data")
        print("   • ✅ Sample transactions with payment scenarios")
        print("   • ✅ Commission rules for shops and products")
        print("   • ✅ Payment records for farmers and buyers")
        print("   • ✅ Audit logs for tracking changes")
        print("   • ✅ Notifications for all user types")
        
        print("\n🔑 Login Credentials:")
        print("   • Superadmin: admin@kisaancenter.com / admin123")
        print("   • Shop Owner: rajesh@shop1.com / shop123")
        print("   • Farmer: ramesh@farmer.com / farmer123")
        print("   • Buyer: amit@buyer.com / buyer123")
        
        print("\n🎯 Next Steps:")
        print("   1. Start the FastAPI server")
        print("   2. Test API endpoints")
        print("   3. Run frontend application")
        print("   4. Verify end-to-end functionality")
                
        return True
    else:
        print(f"❌ Seeding failed. {success_count}/{len(seed_functions)} scripts completed.")
        if failed_scripts:
            print("\n🚨 Failed Scripts:")
            for script in failed_scripts:
                print(f"   • {script}")
        print("\n💡 Troubleshooting Tips:")
        print("   1. Check database connection")
        print("   2. Ensure all migrations are applied")
        print("   3. Verify model imports are correct")
        print("   4. Check for data conflicts")
        return False

if __name__ == "__main__":
    success = run_complete_seeding()
    sys.exit(0 if success else 1)
