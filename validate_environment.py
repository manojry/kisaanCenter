#!/usr/bin/env python3
"""
Environment Variables Validation Script
Checks that all required environment variables are set and validates database connectivity
"""

import os
import sys
from dotenv import load_dotenv

def check_env_vars():
    """Check if all required environment variables are set"""
    load_dotenv()
    
    print("🔍 Environment Variables Validation")
    print("=" * 50)
    
    # Required environment variables
    required_vars = {
        "DB_HOST": "Database host",
        "DB_NAME": "Database name", 
        "DB_USER": "Database username",
        "DB_PASSWORD": "Database password",
        "SECRET_KEY": "JWT secret key"
    }
    
    # Optional environment variables with defaults
    optional_vars = {
        "DB_PORT": ("Database port", "5432"),
        "DB_SSL_MODE": ("Database SSL mode", "require"),
        "API_HOST": ("API host", "0.0.0.0"),
        "API_PORT": ("API port", "8000"),
        "ENVIRONMENT": ("Environment", "development"),
        "DEBUG": ("Debug mode", "true"),
        "LOG_LEVEL": ("Log level", "INFO")
    }
    
    missing_vars = []
    
    print("\n📋 Required Environment Variables:")
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            # Hide sensitive values
            if 'PASSWORD' in var or 'SECRET' in var or 'KEY' in var:
                display_value = '*' * len(value) if len(value) <= 20 else f"{'*' * 8}...{'*' * 8}"
            else:
                display_value = value
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: Not set ({description})")
            missing_vars.append(var)
    
    print("\n📋 Optional Environment Variables:")
    for var, (description, default) in optional_vars.items():
        value = os.getenv(var, default)
        print(f"  ℹ️  {var}: {value} ({description})")
    
    if missing_vars:
        print(f"\n❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("\nTo fix this:")
        print("1. Copy .env.example to .env")
        print("2. Update the values in .env file")
        print("3. Or set the environment variables directly")
        print("\nExample:")
        for var in missing_vars:
            print(f"export {var}=your_value_here")
        return False
    
    print("\n✅ All required environment variables are set!")
    return True

def test_database_connection():
    """Test database connection using environment variables"""
    try:
        import psycopg2
        
        print("\n🔗 Testing Database Connection...")
        
        conn_params = {
            'host': os.getenv('DB_HOST'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'sslmode': os.getenv('DB_SSL_MODE', 'require')
        }
        
        # Test connection
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ Database connection successful!")
        print(f"   Database: {db_version.split(',')[0]}")
        return True
        
    except ImportError:
        print("⚠️  psycopg2 not installed - skipping database connection test")
        print("   Install with: pip install psycopg2-binary")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("\nPossible issues:")
        print("- Check database host and port")
        print("- Verify database credentials")
        print("- Ensure database is running and accessible")
        print("- Check SSL mode configuration")
        return False

def main():
    """Main validation function"""
    print("🚀 KisaanCenter Environment Validation")
    print("=" * 50)
    
    # Check if .env file exists
    if os.path.exists('.env'):
        print("✅ .env file found")
    else:
        print("⚠️  .env file not found - relying on system environment variables")
        if os.path.exists('.env.example'):
            print("💡 Hint: Copy .env.example to .env and customize the values")
    
    # Validate environment variables
    env_valid = check_env_vars()
    
    if not env_valid:
        sys.exit(1)
    
    # Test database connection if all vars are set
    db_valid = test_database_connection()
    
    if env_valid and db_valid:
        print("\n🎉 All validations passed!")
        print("Your environment is properly configured.")
        sys.exit(0)
    else:
        print("\n❌ Some validations failed.")
        print("Please fix the issues above before running the application.")
        sys.exit(1)

if __name__ == "__main__":
    main()
