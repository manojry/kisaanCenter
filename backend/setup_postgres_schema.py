#!/usr/bin/env python3
"""
Setup PostgreSQL Schema for Azure RDS
Creates all required tables and inserts test data
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import hashlib
from datetime import datetime, date

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Load DB config from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'sslmode': os.getenv('DB_SSLMODE', 'require')
}

def hash_password(password):
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def setup_database():
    """Setup complete database schema and test data"""
    print("🔧 Setting up PostgreSQL database schema...")
    
    # Connect to database
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        # 1. Create enums
        print("Creating enums...")
        enums = [
            "CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'manager', 'employee', 'farmer', 'buyer')",
            "CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted')",
            "CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled')",
            "CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'return')",
            "CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'partial')",
            "CREATE TYPE payment_type AS ENUM ('cash', 'card', 'upi', 'bank_transfer')",
            "CREATE TYPE farmer_payment_type AS ENUM ('advance', 'final', 'bonus')",
            "CREATE TYPE credit_status AS ENUM ('pending', 'approved', 'rejected', 'paid')",
            "CREATE TYPE completion_status AS ENUM ('pending', 'in_progress', 'complete')",
            "CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock', 'low_stock')",
            "CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired')",
            "CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly')"
        ]
        
        for enum_sql in enums:
            try:
                cursor.execute(enum_sql)
                print(f"✅ Created enum: {enum_sql.split()[2]}")
            except psycopg2.errors.DuplicateObject:
                print(f"⚠️ Enum already exists: {enum_sql.split()[2]}")
        
        # 2. Create tables
        print("Creating tables...")
        
        # Superadmin table (matches actual schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS superadmin (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Plans table (matches actual schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                monthly_price DECIMAL(10,2) NOT NULL,
                quarterly_price DECIMAL(10,2),
                yearly_price DECIMAL(10,2),
                max_farmers INTEGER NOT NULL,
                max_buyers INTEGER NOT NULL,
                max_transactions INTEGER NOT NULL,
                data_retention_months INTEGER NOT NULL,
                features JSONB,
                status record_status DEFAULT 'active',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Shops table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                address TEXT,
                location VARCHAR(255),
                contact VARCHAR(15),
                commission_rate DECIMAL(5,2) DEFAULT 0.00,
                owner_user_id INTEGER,
                plan_id INTEGER REFERENCES plans(id),
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role user_role NOT NULL,
                contact VARCHAR(15),
                shop_id INTEGER REFERENCES shops(id),
                credit_limit DECIMAL(12,2) DEFAULT 0.00,
                status record_status DEFAULT 'active',
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add foreign key for shop owner (if not exists)
        try:
            cursor.execute("""
                ALTER TABLE shops 
                ADD CONSTRAINT fk_shops_owner_user_id 
                FOREIGN KEY (owner_user_id) REFERENCES users(id)
            """)
        except psycopg2.errors.DuplicateObject:
            print("⚠️ Foreign key constraint already exists: fk_shops_owner_user_id")
        
        # Products table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                category_id INTEGER REFERENCES categories(id),
                price DECIMAL(10,2),
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Farmer stock table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farmer_stock (
                id SERIAL PRIMARY KEY,
                farmer_user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                quantity DECIMAL(10,3) DEFAULT 0.000,
                price DECIMAL(10,2) NOT NULL,
                status stock_status DEFAULT 'in_stock',
                record_status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER REFERENCES shops(id),
                buyer_id INTEGER REFERENCES users(id),
                parent_transaction_id INTEGER REFERENCES transactions(id),
                type transaction_type DEFAULT 'sale',
                status transaction_status DEFAULT 'pending',
                commission_rate DECIMAL(5,2) DEFAULT 0.00,
                commission_amount DECIMAL(12,2) DEFAULT 0.00,
                payment_status payment_status DEFAULT 'unpaid',
                buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
                farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
                commission_confirmed BOOLEAN DEFAULT false,
                completion_status completion_status DEFAULT 'pending',
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Transaction items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transaction_items (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER REFERENCES transactions(id),
                product_id INTEGER REFERENCES products(id),
                farmer_id INTEGER REFERENCES users(id),
                farmer_stock_id INTEGER REFERENCES farmer_stock(id),
                quantity DECIMAL(10,3) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Payment methods table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_methods (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Credits table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                amount DECIMAL(12,2) NOT NULL,
                status credit_status DEFAULT 'pending',
                record_status record_status DEFAULT 'active',
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER REFERENCES transactions(id),
                credit_id INTEGER REFERENCES credits(id),
                amount DECIMAL(12,2) NOT NULL,
                payment_method_id INTEGER REFERENCES payment_methods(id),
                type payment_type NOT NULL,
                status record_status DEFAULT 'active',
                date DATE NOT NULL,
                reference_number VARCHAR(100),
                notes TEXT,
                processed_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Farmer payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farmer_payments (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER REFERENCES transactions(id),
                farmer_stock_id INTEGER REFERENCES farmer_stock(id),
                farmer_user_id INTEGER REFERENCES users(id),
                amount DECIMAL(12,2) NOT NULL,
                payment_type farmer_payment_type NOT NULL,
                payment_method_id INTEGER REFERENCES payment_methods(id),
                remarks TEXT,
                date DATE NOT NULL,
                reference_number VARCHAR(100),
                approved_by INTEGER REFERENCES users(id),
                status record_status DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Subscriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER REFERENCES shops(id),
                plan_id INTEGER REFERENCES plans(id),
                billing_cycle billing_cycle DEFAULT 'monthly',
                auto_renew BOOLEAN DEFAULT true,
                start_date DATE,
                end_date DATE,
                status subscription_status DEFAULT 'active',
                payment_status payment_status DEFAULT 'unpaid',
                amount DECIMAL(10,2),
                discount_amount DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("✅ All tables created successfully")
        
        # 3. Insert test data
        print("Inserting test data...")
        
        # Insert superadmin
        cursor.execute("""
            INSERT INTO superadmin (username, password_hash) 
            VALUES (%s, %s) 
            ON CONFLICT (username) DO NOTHING
        """, ('superadmin', hash_password('admin123')))
        
        # Insert categories
        categories = [
            ('Vegetables', 'Fresh vegetables'),
            ('Fruits', 'Fresh fruits'),
            ('Grains', 'Cereals and grains'),
            ('Test Category', 'For testing purposes')
        ]
        
        for name, desc in categories:
            cursor.execute("""
                INSERT INTO categories (name, description) 
                VALUES (%s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, (name, desc))
        
        # Insert plans (with explicit timestamps)
        cursor.execute("""
            INSERT INTO plans (name, description, monthly_price, max_farmers, max_buyers, max_transactions, data_retention_months, features, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            ON CONFLICT (name) DO NOTHING
        """, ('Basic Plan', 'Basic subscription plan', 999.00, 50, 100, 1000, 12, '{"basic_features": true}'))
        
        # Insert shops
        cursor.execute("""
            INSERT INTO shops (id, name, location, contact, commission_rate, plan_id) 
            VALUES (%s, %s, %s, %s, %s, %s) 
            ON CONFLICT (id) DO NOTHING
        """, (1, 'Test Shop', 'Test Location', '+91-9999999999', 5.0, 1))
        
        # Insert users
        users = [
            (1, 'owner1', hash_password('password'), 'owner', '+91-9876543210', 1, 0.0, 'active', 1),
            (2, 'test_farmer', hash_password('testpass'), 'farmer', '+91-9876543211', 1, 10000.0, 'active', 1),
            (3, 'test_buyer', hash_password('testpass'), 'buyer', '+91-9876543212', 1, 15000.0, 'active', 1),
            (4, 'farmer1', hash_password('password'), 'farmer', '+91-9876543213', 1, 8000.0, 'active', 1),
            (5, 'buyer1', hash_password('password'), 'buyer', '+91-9876543214', 1, 12000.0, 'active', 1),
            (6, 'reddy', hash_password('testpass'), 'farmer', '+91-9876543215', 1, 5000.0, 'active', 1)
        ]
        
        for user_data in users:
            cursor.execute("""
                INSERT INTO users (id, username, password_hash, role, contact, shop_id, credit_limit, status, created_by) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
                ON CONFLICT (id) DO NOTHING
            """, user_data)
        
        # Insert products
        products = [
            (1, 'Test Product', 'Product for testing', 4, 100.0, 'active'),
            (2, 'Tomatoes', 'Fresh tomatoes', 1, 50.0, 'active'),
            (3, 'Apples', 'Fresh apples', 2, 80.0, 'active'),
            (4, 'Rice', 'Basmati rice', 3, 120.0, 'active')
        ]
        
        for product_data in products:
            cursor.execute("""
                INSERT INTO products (id, name, description, category_id, price, status) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                ON CONFLICT (id) DO NOTHING
            """, product_data)
        
        # Insert farmer stock
        farmer_stocks = [
            (1, 2, 1, 50.0, 95.0, 'in_stock', 'active'),
            (2, 2, 2, 100.0, 45.0, 'in_stock', 'active'),
            (3, 4, 3, 75.0, 75.0, 'in_stock', 'active'),
            (4, 6, 4, 200.0, 115.0, 'in_stock', 'active')
        ]
        
        for stock_data in farmer_stocks:
            cursor.execute("""
                INSERT INTO farmer_stock (id, farmer_user_id, product_id, quantity, price, status, record_status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) 
                ON CONFLICT (id) DO NOTHING
            """, stock_data)
        
        # Insert payment methods
        payment_methods = [
            ('Cash', 'Cash payment'),
            ('Card', 'Credit/Debit card payment'),
            ('UPI', 'UPI payment'),
            ('Bank Transfer', 'Bank transfer payment')
        ]
        
        for name, desc in payment_methods:
            cursor.execute("""
                INSERT INTO payment_methods (name, description) 
                VALUES (%s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, (name, desc))
        
        # Insert subscription
        try:
            cursor.execute("""
                INSERT INTO subscriptions (shop_id, plan_id, start_date, end_date, amount) 
                VALUES (%s, %s, %s, %s, %s)
            """, (1, 1, date.today(), date.today().replace(month=date.today().month+1), 999.00))
        except psycopg2.errors.UniqueViolation:
            pass  # Subscription already exists
        
        print("✅ Test data inserted successfully")
        
        # 4. Create indexes
        print("Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id)",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id)",
            "CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id)",
            "CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer_user_id ON farmer_stock(farmer_user_id)",
            "CREATE INDEX IF NOT EXISTS idx_farmer_stock_product_id ON farmer_stock(product_id)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        print("✅ Indexes created successfully")
        
        print("\n🎉 PostgreSQL database setup complete!")
        print("📊 Database contains:")
        print("   - 1 superadmin (username: superadmin, password: admin123)")
        print("   - 1 shop")
        print("   - 6 users (various roles)")
        print("   - 4 categories")
        print("   - 4 products")
        print("   - 4 farmer stock entries")
        print("   - 4 payment methods")
        print("   - 1 subscription plan")
        print("   - 1 active subscription")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_database()