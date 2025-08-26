#!/usr/bin/env python3
"""
Simple AWS RDS Connection Test
Quick script to test your database connection anytime
"""

import os
import sys
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "backend" / "src"))

from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables
load_dotenv()

def test_raw_connection():
    """Test raw PostgreSQL connection using psycopg2"""
    print("🔍 Testing Raw PostgreSQL Connection...")
    
    # Get credentials from environment
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    database = os.getenv("DB_NAME", "postgres")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    print(f"🏠 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🗃️  Database: {database}")
    print(f"👤 User: {username}")
    print("-" * 50)
    
    try:
        # Create connection
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
            sslmode='prefer',  # AWS RDS typically uses SSL
            connect_timeout=10
        )
        
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Test with a simple query
        cursor = connection.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        cursor.execute("SELECT current_database();")
        current_db = cursor.fetchone()
        
        cursor.execute("SELECT current_user;")
        current_user = cursor.fetchone()
        
        print("✅ Connection successful!")
        print(f"📊 PostgreSQL Version: {version[0]}")
        print(f"🗃️  Current Database: {current_db[0]}")
        print(f"👤 Current User: {current_user[0]}")
        
        # Test creating a simple table (if it doesn't exist)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS connection_test (
                id SERIAL PRIMARY KEY,
                test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("INSERT INTO connection_test DEFAULT VALUES RETURNING id;")
        test_id = cursor.fetchone()[0]
        print(f"✅ Test table created and test record inserted (ID: {test_id})")
        
        # Clean up test
        cursor.execute("DROP TABLE IF EXISTS connection_test;")
        print("🧹 Test table cleaned up")
        
        cursor.close()
        connection.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection using our database setup"""
    print("\n🔍 Testing SQLAlchemy Connection...")
    print("-" * 50)
    
    try:
        from db.connection import db_manager, check_database_health
        
        # Test connection
        success = db_manager.test_connection()
        
        if success:
            print("✅ SQLAlchemy connection successful!")
            
            # Get health check
            health = check_database_health()
            print(f"📊 Database Status: {health.get('database', 'unknown')}")
            
            # Get connection pool info
            pool_info = db_manager.get_connection_info()
            if pool_info.get('status') != 'not_initialized':
                print(f"🏊 Connection Pool Info:")
                print(f"   • Pool Size: {pool_info.get('pool_size', 'N/A')}")
                print(f"   • Checked In: {pool_info.get('checked_in', 'N/A')}")
                print(f"   • Checked Out: {pool_info.get('checked_out', 'N/A')}")
            
            return True
        else:
            print("❌ SQLAlchemy connection failed!")
            return False
            
    except ImportError as e:
        print(f"⚠️  SQLAlchemy modules not available: {e}")
        print("Run the raw connection test instead")
        return False
    except Exception as e:
        print(f"❌ SQLAlchemy Error: {e}")
        return False

def main():
    """Main test function"""
    print("🌾 Market Management System - Database Connection Test")
    print("=" * 60)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found!")
        print("Please create a .env file with your database credentials:")
        print("DB_HOST=your-rds-endpoint.amazonaws.com")
        print("DB_PORT=5432")
        print("DB_NAME=postgres")
        print("DB_USER=your-username")
        print("DB_PASSWORD=your-password")
        return
    
    # Test 1: Raw PostgreSQL connection
    raw_success = test_raw_connection()
    
    # Test 2: SQLAlchemy connection (if available)
    sqlalchemy_success = test_sqlalchemy_connection()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary:")
    print(f"   Raw PostgreSQL: {'✅ PASS' if raw_success else '❌ FAIL'}")
    print(f"   SQLAlchemy:     {'✅ PASS' if sqlalchemy_success else '❌ FAIL'}")
    
    if raw_success:
        print("\n🎉 Your AWS RDS connection is working!")
        print("Next steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Create tables: python setup_aws_rds.py")
        print("3. Start development: python backend/src/main.py")
    else:
        print("\n❌ Connection failed. Please check:")
        print("1. Your .env file has correct credentials")
        print("2. Your AWS RDS instance is running")
        print("3. Security groups allow connections on port 5432")
        print("4. Your local IP is allowed in RDS security group")

if __name__ == "__main__":
    main()
