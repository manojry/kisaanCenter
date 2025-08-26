#!/usr/bin/env python3
"""
Simple database seeding script
"""

import sys
import os
sys.path.insert(0, '.')

def main():
    print("=" * 60)
    print("KISAAN CENTER - DATABASE SEEDING")
    print("=" * 60)
    
    try:
        # Test imports
        print("1. Testing imports...")
        from backend.src.models import User, UserRole, Shop, Category
        from backend.src.db.connection import get_db_session
        from backend.src.db.seeds.seed_data import DatabaseSeeder
        print("   ✓ All imports successful")
        
        # Test database connection
        print("2. Testing database connection...")
        with get_db_session() as session:
            result = session.execute("SELECT 1").scalar()
            print(f"   ✓ Database connection successful (result: {result})")
        
        # Initialize seeder
        print("3. Initializing seeder...")
        seeder = DatabaseSeeder()
        print("   ✓ Seeder initialized")
        
        # Verify database connection in seeder
        print("4. Verifying database in seeder...")
        if not seeder.verify_database_connection():
            print("   ❌ Database verification failed")
            return 1
        print("   ✓ Database verification successful")
        
        # Start seeding
        print("5. Starting database seeding...")
        success = seeder.seed_all(include_test_data=True)
        
        if success:
            print("   ✓ Database seeding completed successfully!")
            
            # Show summary
            summary = seeder.get_seed_summary()
            print("\n6. Seeding Summary:")
            for entity, count in summary.items():
                print(f"   - {entity}: {count} records")
                
            return 0
        else:
            print("   ❌ Database seeding failed!")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    print("=" * 60)
    sys.exit(exit_code)
