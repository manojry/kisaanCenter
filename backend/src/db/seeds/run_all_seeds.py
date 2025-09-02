
"""
Master Seed Runner
Purpose: Runs all seed scripts in the correct order
Usage: python -m src.db.seeds.run_all_seeds
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from src.db.seeds.seed_001_basic_reference_data import seed_basic_reference_data
from src.db.seeds.seed_002_sample_users_and_shops import seed_sample_users_and_shops
from src.db.seeds.seed_003_products_and_stock import seed_products_and_stock
from src.db.seeds.seed_004_sample_transactions import seed_sample_transactions

def run_all_seeds():
    """Run all seed scripts in order"""
    print("🚀 KisaanCenter Database Seeding")
    print("=" * 60)
    
    seed_functions = [
        ("001 - Basic Reference Data", seed_basic_reference_data),
        ("002 - Sample Users and Shops", seed_sample_users_and_shops),
        ("003 - Products and Stock", seed_products_and_stock),
        ("004 - Sample Transactions", seed_sample_transactions)
    ]
    
    success_count = 0
    
    for name, seed_func in seed_functions:
        print(f"\n📦 Running: {name}")
        try:
            result = seed_func()
            if result:
                success_count += 1
                print(f"✅ {name} completed successfully")
            else:
                print(f"❌ {name} failed")
                break
        except Exception as e:
            print(f"❌ {name} failed with error: {str(e)}")
            break
    
    print("\n" + "=" * 60)
    if success_count == len(seed_functions):
        print("🎉 All seed scripts completed successfully!")
        print("\n📊 Sample Data Created:")
        print("   • Categories, Units, Plans")
        print("   • Users (Admin, Shop Owners, Farmers, Buyers)")
        print("   • Shops with commission rates")
        print("   • Products with stock data")
        print("   • Sample transactions with various payment scenarios")
        print("\n🔑 Login Credentials:")
        print("   • Superadmin: admin@kisaancenter.com / admin123")
        print("   • Shop Owner: rajesh@shop1.com / shop123")
        print("   • Farmer: ramesh@farmer.com / farmer123")
        print("   • Buyer: amit@buyer.com / buyer123")
        return True
    else:
        print(f"❌ Seeding failed. {success_count}/{len(seed_functions)} scripts completed.")
        return False

if __name__ == "__main__":
    success = run_all_seeds()
    sys.exit(0 if success else 1)
