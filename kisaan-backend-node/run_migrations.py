import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', 5432),
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def run_migrations():
    """Run all migrations by executing SQL directly"""
    conn = connect_db()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create SequelizeMeta table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
                "name" VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
            );
        ''')
        
        print("✅ SequelizeMeta table ready")
        
        # Migration 001: Users table
        print("\n📝 Creating kisaan_users table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(15) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # Check if migration already recorded
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('001_create_kisaan_users_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('001_create_kisaan_users_table.js',))
        
        print("✅ kisaan_users table created")
        
        # Migration 002: Shops table
        print("\n📝 Creating kisaan_shops table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_shops (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                address TEXT,
                phone VARCHAR(15),
                email VARCHAR(100),
                owner_id INTEGER REFERENCES kisaan_users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('002_create_kisaan_shops_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('002_create_kisaan_shops_table.js',))
        
        print("✅ kisaan_shops table created")
        
        # Migration 003: Categories table
        print("\n📝 Creating kisaan_categories table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('003_create_kisaan_categories_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('003_create_kisaan_categories_table.js',))
        
        print("✅ kisaan_categories table created")
        
        # Migration 004: Plans table
        print("\n📝 Creating kisaan_plans table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL,
                features JSONB,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('004_create_kisaan_plans_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('004_create_kisaan_plans_table.js',))
        
        print("✅ kisaan_plans table created")
        
        # Migration 005: Transactions table
        print("\n📝 Creating kisaan_transactions table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES kisaan_users(id) ON DELETE CASCADE,
                shop_id INTEGER REFERENCES kisaan_shops(id) ON DELETE CASCADE,
                plan_id INTEGER REFERENCES kisaan_plans(id) ON DELETE SET NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                payment_method VARCHAR(50),
                transaction_status VARCHAR(50) DEFAULT 'pending',
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('005_create_kisaan_transactions_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('005_create_kisaan_transactions_table.js',))
        
        print("✅ kisaan_transactions table created")
        
        # Migration 006: Credits table
        print("\n📝 Creating kisaan_credits table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_credits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES kisaan_users(id) ON DELETE CASCADE,
                shop_id INTEGER REFERENCES kisaan_shops(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                transaction_id INTEGER REFERENCES kisaan_transactions(id) ON DELETE SET NULL,
                credit_type VARCHAR(50) DEFAULT 'purchase',
                status VARCHAR(20) DEFAULT 'active',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('006_create_kisaan_credits_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('006_create_kisaan_credits_table.js',))
        
        print("✅ kisaan_credits table created")
        
        # Migration 007: Products table
        print("\n📝 Creating kisaan_products table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INTEGER REFERENCES kisaan_categories(id) ON DELETE SET NULL,
                shop_id INTEGER REFERENCES kisaan_shops(id) ON DELETE CASCADE,
                stock_quantity INTEGER DEFAULT 0,
                unit VARCHAR(50),
                images JSONB,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('007_create_kisaan_products_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('007_create_kisaan_products_table.js',))
        
        print("✅ kisaan_products table created")
        
        # Migration 008: Shop Categories table
        print("\n📝 Creating kisaan_shop_categories table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_shop_categories (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER REFERENCES kisaan_shops(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES kisaan_categories(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(shop_id, category_id)
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('008_create_kisaan_shop_categories_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('008_create_kisaan_shop_categories_table.js',))
        
        print("✅ kisaan_shop_categories table created")
        
        # Migration 009: Payments table (without foreign key to payment_methods)
        print("\n📝 Creating kisaan_payments table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kisaan_payments (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER REFERENCES kisaan_transactions(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_gateway VARCHAR(100),
                gateway_transaction_id VARCHAR(200),
                gateway_response JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        cursor.execute('SELECT name FROM "SequelizeMeta" WHERE name = %s', ('009_create_payments_table.js',))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO "SequelizeMeta" (name) VALUES (%s)', ('009_create_payments_table.js',))
        
        print("✅ kisaan_payments table created")
        
        # Commit all changes
        conn.commit()
        print("\n🎯 All migrations completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🔄 Starting Python-based migrations...")
    success = run_migrations()
    if success:
        print("\n✅ Database setup complete! You can now run the seeds.")
    else:
        print("\n❌ Migration failed!")
