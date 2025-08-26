#!/usr/bin/env python3
"""
AWS RDS Table Creation Script
Direct table creation without complex imports
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables
load_dotenv()

def create_tables():
    """Create all tables directly using SQL"""
    
    # Database connection parameters
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    database = os.getenv("DB_NAME", "postgres")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    print("🌾 Market Management System - AWS RDS Table Creation")
    print("=" * 60)
    print(f"🏠 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🗃️  Database: {database}")
    print(f"👤 User: {username}")
    print("-" * 60)
    
    if not all([host, username, password]):
        print("❌ Missing required credentials in .env file!")
        return False
    
    try:
        print("🔄 Connecting to AWS RDS...")
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
        
        # Get PostgreSQL version
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"📊 PostgreSQL Version: {version[0][:50]}...")
        
        print("\n🔄 Creating tables...")
        
        # SQL table creation statements based on your ERD
        tables = {
            "users": """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    phone VARCHAR(20) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
                    location VARCHAR(200),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            
            "crops": """
                CREATE TABLE IF NOT EXISTS crops (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            
            "listings": """
                CREATE TABLE IF NOT EXISTS listings (
                    id SERIAL PRIMARY KEY,
                    farmer_id INTEGER NOT NULL,
                    crop_id INTEGER NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    quantity DECIMAL(10,2) NOT NULL,
                    unit VARCHAR(20) NOT NULL,
                    price_per_unit DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
                    location VARCHAR(200),
                    harvest_date DATE,
                    expiry_date DATE,
                    quality_grade VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE RESTRICT
                );
            """,
            
            "bids": """
                CREATE TABLE IF NOT EXISTS bids (
                    id SERIAL PRIMARY KEY,
                    listing_id INTEGER NOT NULL,
                    buyer_id INTEGER NOT NULL,
                    price_per_unit DECIMAL(10,2) NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL,
                    total_amount DECIMAL(12,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """,
            
            "transactions": """
                CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    bid_id INTEGER NOT NULL,
                    farmer_id INTEGER NOT NULL,
                    buyer_id INTEGER NOT NULL,
                    listing_id INTEGER NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL,
                    price_per_unit DECIMAL(10,2) NOT NULL,
                    total_amount DECIMAL(12,2) NOT NULL,
                    platform_fee DECIMAL(10,2) DEFAULT 0.00,
                    farmer_amount DECIMAL(12,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
                    payment_method VARCHAR(50),
                    payment_reference VARCHAR(100),
                    delivery_address TEXT,
                    delivery_date DATE,
                    completion_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE RESTRICT,
                    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE RESTRICT,
                    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
                    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT
                );
            """,
            
            "escrow_accounts": """
                CREATE TABLE IF NOT EXISTS escrow_accounts (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER NOT NULL,
                    amount DECIMAL(12,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'released_to_farmer', 'refunded_to_buyer')),
                    held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    released_at TIMESTAMP,
                    released_to VARCHAR(20),
                    notes TEXT,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT
                );
            """,
            
            "notifications": """
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """,
            
            "financial_records": """
                CREATE TABLE IF NOT EXISTS financial_records (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'fee', 'refund', 'payout')),
                    amount DECIMAL(12,2) NOT NULL,
                    description TEXT,
                    payment_gateway VARCHAR(50),
                    gateway_transaction_id VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
                );
            """
        }
        
        # Create tables
        for table_name, sql in tables.items():
            try:
                cursor.execute(sql)
                print(f"✅ Created table: {table_name}")
            except Exception as e:
                print(f"❌ Error creating table {table_name}: {e}")
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
            "CREATE INDEX IF NOT EXISTS idx_listings_farmer ON listings(farmer_id);",
            "CREATE INDEX IF NOT EXISTS idx_listings_crop ON listings(crop_id);",
            "CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);",
            "CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);",
            "CREATE INDEX IF NOT EXISTS idx_bids_buyer ON bids(buyer_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_farmer ON transactions(farmer_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);",
            "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_financial_records_transaction ON financial_records(transaction_id);",
        ]
        
        print("\n🔄 Creating indexes...")
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                print("✅ Index created")
            except Exception as e:
                print(f"❌ Error creating index: {e}")
        
        # Insert some sample crops
        sample_crops = [
            ('Rice', 'Grains'),
            ('Wheat', 'Grains'),
            ('Tomato', 'Vegetables'),
            ('Onion', 'Vegetables'),
            ('Potato', 'Vegetables'),
            ('Apple', 'Fruits'),
            ('Banana', 'Fruits'),
            ('Cotton', 'Cash Crops'),
            ('Sugarcane', 'Cash Crops'),
            ('Mango', 'Fruits')
        ]
        
        print("\n🔄 Inserting sample crops...")
        for crop_name, category in sample_crops:
            try:
                cursor.execute(
                    "INSERT INTO crops (name, category) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (crop_name, category)
                )
                print(f"✅ Added crop: {crop_name}")
            except Exception as e:
                print(f"❌ Error adding crop {crop_name}: {e}")
        
        # Verify tables
        print("\n🔍 Verifying tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables_created = cursor.fetchall()
        print(f"📊 Tables in database: {len(tables_created)}")
        for table in tables_created:
            print(f"   • {table[0]}")
        
        cursor.close()
        connection.close()
        
        print("\n🎉 AWS RDS database setup completed successfully!")
        print("📋 Summary:")
        print(f"   • Tables created: {len(tables)}")
        print(f"   • Indexes created: {len(indexes)}")
        print(f"   • Sample crops added: {len(sample_crops)}")
        print("\nNext steps:")
        print("1. Start the FastAPI server: uvicorn backend.src.main:app --reload")
        print("2. Access API docs: http://localhost:8000/docs")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    if not success:
        print("\n❌ Setup failed. Please check:")
        print("1. Your .env file has correct credentials")
        print("2. Your AWS RDS instance is running")
        print("3. Security groups allow connections on port 5432")
        print("4. Your local IP is allowed in RDS security group")
        exit(1)
