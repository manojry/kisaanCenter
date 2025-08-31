#!/usr/bin/env python3
"""
AWS RDS PostgreSQL Connection Test and Table Creation Script
Connects to your AWS RDS instance and creates all database tables
"""

import os
import sys
import logging
"""
setup_aws_rds.py

Purpose: Configures AWS RDS for database hosting.
Usage: python scripts/setup_aws_rds.py
Dependencies: boto3, AWS credentials
"""
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from dotenv import load_dotenv
from db.connection import db_manager, config, check_database_health
from db.init_db import initialize_database, get_database_info
from models import Base

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_aws_rds_connection():
    """Test connection to AWS RDS PostgreSQL instance"""
    print("🔍 Testing AWS RDS PostgreSQL Connection...")
    print(f"🏠 Host: {config.DB_HOST}")
    print(f"🔌 Port: {config.DB_PORT}")
    print(f"🗃️  Database: {config.DB_NAME}")
    print(f"👤 User: {config.DB_USER}")
    print(f"🌍 Environment: {config.ENVIRONMENT}")
    print("-" * 50)
    
    try:
        # Test basic connection
        success = db_manager.test_connection()
        
        if success:
            print("✅ Connection to AWS RDS successful!")
            
            # Get detailed health check
            health = check_database_health()
            print(f"📊 Database Status: {health['database']}")
            
            if health.get('connection_pool'):
                pool_info = health['connection_pool']
                print(f"🏊 Connection Pool - Size: {pool_info.get('pool_size', 'N/A')}")
                print(f"📥 Checked In: {pool_info.get('checked_in', 'N/A')}")
                print(f"📤 Checked Out: {pool_info.get('checked_out', 'N/A')}")
            
            return True
        else:
            print("❌ Connection to AWS RDS failed!")
            return False
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return False

def create_database_tables():
    """Create all database tables using the models"""
    print("\n🏗️  Creating Database Tables...")
    print("-" * 50)
    
    try:
        # Initialize database (this will create all tables)
        success = initialize_database(create_db=False, create_tables=True)
        
        if success:
            print("✅ All database tables created successfully!")
            
            # Get database info to show created tables
            db_info = get_database_info()
            if 'tables' in db_info:
                tables = list(db_info['tables'].keys())
                print(f"📋 Created/Verified {len(tables)} tables:")
                for table in sorted(tables):
                    print(f"   • {table}")
            else:
                print("ℹ️  Tables created successfully")
                
            return True
        else:
            print("❌ Failed to create tables")
            return False
            
    except Exception as e:
        print(f"❌ Table Creation Error: {str(e)}")
        logger.exception("Detailed error information:")
        return False

def verify_table_creation():
    """Verify that all expected tables were created"""
    print("\n🔍 Verifying Table Creation...")
    print("-" * 50)
    
    try:
        with db_manager.get_db_session() as session:
            # Query to get all tables in the database
            query = """
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
            """
            
            result = session.execute(query)
            tables = [row[0] for row in result.fetchall()]
            
            print(f"📋 Found {len(tables)} tables in database:")
            for table in tables:
                print(f"   • {table}")
            
            # Expected tables from our models
            expected_tables = {
                'superadmin', 'shop', 'user', 'product', 'farmer_stock',
                'transaction', 'transaction_item', 'credit', 'credit_detail',
                'payment', 'farmer_payment', 'category', 'plan', 
                'payment_method', 'audit_log'
            }
            
            missing_tables = expected_tables - set(tables)
            if missing_tables:
                print(f"\n⚠️  Missing expected tables: {', '.join(missing_tables)}")
            else:
                print("\n✅ All expected tables are present!")
                
            return len(missing_tables) == 0
            
    except Exception as e:
        print(f"❌ Verification Error: {str(e)}")
        return False

def show_connection_details():
    """Show detailed connection information"""
    print("\n📊 Connection Details:")
    print("-" * 50)
    print(f"Database URL: {config.database_url}")
    print(f"SSL Mode: {config.DB_SSL_MODE}")
    print(f"Pool Size: {config.POOL_SIZE}")
    print(f"Max Overflow: {config.MAX_OVERFLOW}")
    print(f"Pool Recycle: {config.POOL_RECYCLE}s")

def main():
    """Main execution function"""
    print("🌾 Market Management System - AWS RDS Setup")
    print("=" * 60)
    
    # Step 1: Test connection
    if not test_aws_rds_connection():
        print("\n❌ Exiting due to connection failure")
        sys.exit(1)
    
    # Step 2: Create tables
    if not create_database_tables():
        print("\n❌ Exiting due to table creation failure")
        sys.exit(1)
    
    # Step 3: Verify tables
    if not verify_table_creation():
        print("\n⚠️  Some tables may be missing")
    
    # Step 4: Show connection details
    show_connection_details()
    
    print("\n🎉 AWS RDS Setup Complete!")
    print("Your database is ready for development.")
    print("\nNext steps:")
    print("1. Run 'python backend/test_connection.py' to test anytime")
    print("2. Start your FastAPI server with 'python backend/src/main.py'")
    print("3. Check the API at http://localhost:8000/docs")

if __name__ == "__main__":
    main()
