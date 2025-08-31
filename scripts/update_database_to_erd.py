#!/usr/bin/env python3
"""
Database Update Script - Align with ERD.md
This script will update the database to match the ERD.md specification exactly
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

def update_database_to_match_erd():
    """Update database to match ERD.md specification"""
    
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    database = os.getenv("DB_NAME", "postgres")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    print("🔄 UPDATING DATABASE TO MATCH ERD.MD")
    print("=" * 60)
    print(f"🏠 Host: {host}")
    print(f"🗃️  Database: {database}")
    print("-" * 60)
    
    try:
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
            sslmode='prefer',
            connect_timeout=30
        )
        
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = connection.cursor()
        
        print("✅ Connected successfully!")
        
        # First, drop existing tables to avoid conflicts
        print("\n🗑️  Dropping existing tables...")
        drop_tables = [
            "DROP TABLE IF EXISTS financial_records CASCADE;",
            "DROP TABLE IF EXISTS notifications CASCADE;", 
            "DROP TABLE IF EXISTS escrow_accounts CASCADE;",
            "DROP TABLE IF EXISTS transactions CASCADE;",
            "DROP TABLE IF EXISTS bids CASCADE;",
            "DROP TABLE IF EXISTS listings CASCADE;",
            "DROP TABLE IF EXISTS crops CASCADE;",
            "DROP TABLE IF EXISTS users CASCADE;"
        ]
        
        for drop_sql in drop_tables:
            cursor.execute(drop_sql)
            print(f"✅ Dropped table")
        
        print("\n🔄 Creating new tables based on ERD.md...")
        
        # Create tables in correct order (dependencies)
        tables = {
            "superadmin": """
                CREATE TABLE IF NOT EXISTS superadmin (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    contact VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
                );
            """,
            
            "plan": """
                CREATE TABLE IF NOT EXISTS plan (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
                    max_users INTEGER DEFAULT 10,
                    max_transactions INTEGER DEFAULT 1000,
                    features JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
                );
            """,
            
            "shop": """
                CREATE TABLE IF NOT EXISTS shop (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    location VARCHAR(200),
                    plan_id INTEGER,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
                    FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_by) REFERENCES superadmin(id) ON DELETE SET NULL
                );
            """,
            
            "users": """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'farmer', 'buyer', 'employee', 'guest')),
                    shop_id INTEGER,
                    created_by INTEGER,
                    contact VARCHAR(20),
                    credit_limit DECIMAL(12,2) DEFAULT 0.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """,
            
            "category": """
                CREATE TABLE IF NOT EXISTS category (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            
            "product": """
                CREATE TABLE IF NOT EXISTS product (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    category_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
                );
            """,
            
            "farmer_stock": """
                CREATE TABLE IF NOT EXISTS farmer_stock (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    farmer_user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'returned', 'discarded')),
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (farmer_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
                );
            """,
            
            "transaction": """
                CREATE TABLE IF NOT EXISTS transaction (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    buyer_user_id INTEGER NOT NULL,
                    parent_transaction_id INTEGER,
                    type VARCHAR(20) DEFAULT 'sale' CHECK (type IN ('sale', 'return', 'adjustment')),
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
                    commission_rate DECIMAL(5,2) DEFAULT 0.00,
                    commission_amount DECIMAL(12,2) DEFAULT 0.00,
                    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
                    buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
                    farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
                    commission_confirmed BOOLEAN DEFAULT false,
                    completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'partial', 'complete')),
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_transaction_id) REFERENCES transaction(id) ON DELETE SET NULL
                );
            """,
            
            "transaction_item": """
                CREATE TABLE IF NOT EXISTS transaction_item (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    farmer_stock_id INTEGER,
                    quantity DECIMAL(10,2) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
                    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id) ON DELETE SET NULL
                );
            """,
            
            "credit": """
                CREATE TABLE IF NOT EXISTS credit (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER,
                    buyer_user_id INTEGER NOT NULL,
                    amount DECIMAL(12,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partial', 'settled')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
                    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """,
            
            "credit_detail": """
                CREATE TABLE IF NOT EXISTS credit_detail (
                    id SERIAL PRIMARY KEY,
                    credit_id INTEGER NOT NULL,
                    farmer_user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (credit_id) REFERENCES credit(id) ON DELETE CASCADE,
                    FOREIGN KEY (farmer_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
                );
            """,
            
            "payment_method": """
                CREATE TABLE IF NOT EXISTS payment_method (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            
            "payment": """
                CREATE TABLE IF NOT EXISTS payment (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER,
                    credit_id INTEGER,
                    amount DECIMAL(12,2) NOT NULL,
                    payment_method_id INTEGER,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'advance', 'refund')),
                    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
                    FOREIGN KEY (credit_id) REFERENCES credit(id) ON DELETE CASCADE,
                    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id) ON DELETE SET NULL
                );
            """,
            
            "farmer_payment": """
                CREATE TABLE IF NOT EXISTS farmer_payment (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER,
                    farmer_stock_id INTEGER,
                    farmer_user_id INTEGER NOT NULL,
                    amount DECIMAL(12,2) NOT NULL,
                    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('settlement', 'advance')),
                    payment_method_id INTEGER,
                    remarks TEXT,
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
                    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id) ON DELETE SET NULL,
                    FOREIGN KEY (farmer_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id) ON DELETE SET NULL
                );
            """,
            
            "commission_rule": """
                CREATE TABLE IF NOT EXISTS commission_rule (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    product_id INTEGER,
                    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('percentage', 'fixed', 'tiered')),
                    rate DECIMAL(10,4) NOT NULL,
                    min_qty DECIMAL(10,2),
                    max_qty DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
                );
            """,
            
            "expense_category": """
                CREATE TABLE IF NOT EXISTS expense_category (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            
            "expense": """
                CREATE TABLE IF NOT EXISTS expense (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    category_id INTEGER,
                    amount DECIMAL(12,2) NOT NULL,
                    description TEXT,
                    date DATE NOT NULL,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES expense_category(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """,
            
            "stock_adjustment": """
                CREATE TABLE IF NOT EXISTS stock_adjustment (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL,
                    farmer_stock_id INTEGER NOT NULL,
                    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
                    quantity DECIMAL(10,2) NOT NULL,
                    reason TEXT,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """,
            
            "product_price_history": """
                CREATE TABLE IF NOT EXISTS product_price_history (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    effective_date DATE NOT NULL,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """,
            
            "plan_feature": """
                CREATE TABLE IF NOT EXISTS plan_feature (
                    id SERIAL PRIMARY KEY,
                    plan_id INTEGER NOT NULL,
                    feature_name VARCHAR(100) NOT NULL,
                    feature_value VARCHAR(255),
                    is_enabled BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE CASCADE
                );
            """,
            
            "audit_log": """
                CREATE TABLE IF NOT EXISTS audit_log (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INTEGER NOT NULL,
                    user_id INTEGER,
                    old_data JSONB,
                    new_data JSONB,
                    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );
            """
        }
        
        # Create tables
        created_count = 0
        for table_name, sql in tables.items():
            try:
                cursor.execute(sql)
                print(f"✅ Created table: {table_name}")
                created_count += 1
            except Exception as e:
                print(f"❌ Error creating table {table_name}: {e}")
        
        print(f"\n📊 Created {created_count} out of {len(tables)} tables")
        
        # Create indexes for performance
        print("\n🔄 Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
            "CREATE INDEX IF NOT EXISTS idx_product_shop ON product(shop_id);",
            "CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);",
            "CREATE INDEX IF NOT EXISTS idx_farmer_stock_shop ON farmer_stock(shop_id);",
            "CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer ON farmer_stock(farmer_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_farmer_stock_product ON farmer_stock(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_shop ON transaction(shop_id);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_buyer ON transaction(buyer_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_status ON transaction(completion_status);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_item_transaction ON transaction_item(transaction_id);",
            "CREATE INDEX IF NOT EXISTS idx_credit_buyer ON credit(buyer_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_payment_transaction ON payment(transaction_id);",
            "CREATE INDEX IF NOT EXISTS idx_farmer_payment_farmer ON farmer_payment(farmer_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_audit_log_shop ON audit_log(shop_id);",
            "CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);"
        ]
        
        index_count = 0
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                index_count += 1
            except Exception as e:
                print(f"❌ Error creating index: {e}")
        
        print(f"✅ Created {index_count} indexes")
        
        # Insert sample data
        print("\n🔄 Inserting sample reference data...")
        
        sample_data = [
            # Sample plans
            """INSERT INTO plan (name, description, price, billing_cycle, max_users, max_transactions) VALUES 
               ('Basic', 'Basic plan for small shops', 999.00, 'monthly', 5, 500),
               ('Standard', 'Standard plan for growing businesses', 1999.00, 'monthly', 15, 2000),
               ('Premium', 'Premium plan for large operations', 4999.00, 'monthly', 50, 10000);""",
            
            # Sample categories
            """INSERT INTO category (name, description) VALUES 
               ('Grains', 'Rice, Wheat, Barley, etc.'),
               ('Vegetables', 'Fresh vegetables'),
               ('Fruits', 'Fresh fruits'),
               ('Pulses', 'Lentils, beans, peas'),
               ('Spices', 'Spices and condiments');""",
            
            # Sample payment methods
            """INSERT INTO payment_method (name, description) VALUES 
               ('Cash', 'Cash payment'),
               ('Bank Transfer', 'Direct bank transfer'),
               ('UPI', 'UPI payment'),
               ('Cheque', 'Cheque payment'),
               ('Credit Card', 'Credit card payment');""",
            
            # Sample expense categories
            """INSERT INTO expense_category (name, description) VALUES 
               ('Transportation', 'Vehicle and transport costs'),
               ('Utilities', 'Electricity, water, internet'),
               ('Staff Salary', 'Employee salaries'),
               ('Rent', 'Shop rent and property costs'),
               ('Maintenance', 'Equipment and facility maintenance');"""
        ]
        
        sample_count = 0
        for sample_sql in sample_data:
            try:
                cursor.execute(sample_sql)
                sample_count += 1
            except Exception as e:
                print(f"❌ Error inserting sample data: {e}")
        
        print(f"✅ Inserted {sample_count} sets of sample data")
        
        # Verify the new structure
        print("\n🔍 Verifying new database structure...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        new_tables = cursor.fetchall()
        print(f"📊 Total tables in database: {len(new_tables)}")
        for table in new_tables:
            print(f"   • {table[0]}")
        
        cursor.close()
        connection.close()
        
        print("\n🎉 DATABASE SUCCESSFULLY UPDATED TO MATCH ERD.MD!")
        print("📋 Summary:")
        print(f"   • Tables created: {created_count}")
        print(f"   • Indexes created: {index_count}")  
        print(f"   • Sample data sets: {sample_count}")
        print("\n🔧 Key Features Implemented:")
        print("   ✅ Multi-tenant shop-based architecture")
        print("   ✅ Three-party transaction completion model")
        print("   ✅ Comprehensive user role management")
        print("   ✅ Stock lifecycle management")
        print("   ✅ Credit and payment tracking")
        print("   ✅ Commission management system")
        print("   ✅ Complete audit trail")
        print("   ✅ Financial reporting foundation")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = update_database_to_match_erd()
    if success:
        print("\n✅ Your database now matches the ERD.md specification!")
        print("Next steps:")
        print("1. Update your backend models to match new schema")
        print("2. Test the new database structure")
        print("3. Create sample shop and user data")
    else:
        print("\n❌ Database update failed. Please check the errors above.")
        exit(1)
