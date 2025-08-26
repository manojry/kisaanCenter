#!/usr/bin/env python3
"""
Database seeding script for Kisaan Center
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_imports():
    """Test all required imports"""
    try:
        print("Testing imports...")
        
        # Test basic imports
        import sqlalchemy
        print(f"✓ SQLAlchemy {sqlalchemy.__version__} imported")
        
        # Test models
        from backend.src.models import User, UserRole, Shop, Product
        print("✓ Models imported successfully")
        
        # Test database connection
        from backend.src.db.connection import get_db_session
        print("✓ Database connection imported")
        
        # Test seed data
        from backend.src.db.seeds.seed_data import DatabaseSeeder
        print("✓ Seed data imported")
        
        return True
        
    except Exception as e:
        print(f"✗ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_connection():
    """Test database connection"""
    try:
        print("\nTesting database connection...")
        
        from backend.src.db.connection import get_db_session
        
        with get_db_session() as session:
            result = session.execute("SELECT version()").fetchone()
            print(f"✓ Connected to PostgreSQL: {result[0][:50]}...")
            return True
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def seed_database():
    """Run the database seeding"""
    try:
        print("\nStarting database seeding...")
        
        from backend.src.db.seeds.seed_data import DatabaseSeeder
        
        seeder = DatabaseSeeder()
        
        # First verify connection
        if not seeder.verify_database_connection():
            print("✗ Database connection verification failed")
            return False
        
        print("✓ Database connection verified")
        
        # Run seeding with test data
        success = seeder.seed_all(include_test_data=True)
        
        if success:
            print("✓ Database seeding completed successfully!")
            
            # Print summary
            summary = seeder.get_seed_summary()
            print("\nSeeding Summary:")
            for entity, count in summary.items():
                print(f"  {entity}: {count} records")
            
            return True
        else:
            print("✗ Database seeding failed")
            return False
            
    except Exception as e:
        print(f"✗ Seeding error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("KISAAN CENTER - DATABASE SEEDING")
    print("=" * 60)
    
    # Step 1: Test imports
    if not test_imports():
        print("\n❌ Import test failed. Please fix import issues.")
        return 1
    
    # Step 2: Test database connection
    if not test_database_connection():
        print("\n❌ Database connection failed. Please check your .env file.")
        return 1
    
    # Step 3: Seed database
    if not seed_database():
        print("\n❌ Database seeding failed.")
        return 1
    
    print("\n🎉 All operations completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
