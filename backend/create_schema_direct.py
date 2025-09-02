#!/usr/bin/env python3
"""
Direct schema creation script to bypass Alembic enum issues
This script will create the database schema directly using raw SQL
"""

import psycopg2
from src.db.connection import DatabaseConfig

def create_schema():
    try:
        config = DatabaseConfig()
        
        # Create direct psycopg2 connection
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            sslmode=config.DB_SSL_MODE
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Creating database schema...")
        
        # First create all enum types
        cursor.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer', 'employee');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
                    CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
                    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
                    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
                    CREATE TYPE payment_type AS ENUM ('full_payment', 'partial_payment', 'advance');
                END IF;
            END $$;
        """)
        print("✓ Created enum types")
        
        # Create USERS table (without foreign keys to shops initially)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                role user_role NOT NULL,
                shop_id INTEGER,
                password_hash VARCHAR(255),
                contact VARCHAR(50),
                credit_limit NUMERIC(12,2),
                record_status record_status DEFAULT 'active',
                created_by INTEGER,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created users table")
        
        # Create SHOPS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                owner_id INTEGER,
                location VARCHAR(255),
                commission_rate NUMERIC(5,2) DEFAULT 0.00,
                record_status record_status DEFAULT 'active',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created shops table")
        
        # Create CATEGORIES table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created categories table")
        
        # Create PRODUCTS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category_id INTEGER,
                price NUMERIC(12,2),
                shop_id INTEGER,
                record_status record_status DEFAULT 'active',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created products table")
        
        # Create SHOP_PRODUCTS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shop_products (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER,
                product_id INTEGER,
                is_active BOOLEAN DEFAULT TRUE
            );
        """)
        print("✓ Created shop_products table")
        
        # Create FARMER_STOCK table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farmer_stock (
                id SERIAL PRIMARY KEY,
                farmer_id INTEGER,
                shop_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                record_status record_status DEFAULT 'active',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created farmer_stock table")
        
        # Create TRANSACTIONS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                shop_id INTEGER,
                buyer_id INTEGER,
                transaction_type VARCHAR(20),
                commission_rate NUMERIC(5,2),
                status transaction_status,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created transactions table")
        
        # Create TRANSACTION_ITEMS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transaction_items (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER,
                product_id INTEGER,
                farmer_stock_id INTEGER,
                quantity INTEGER,
                price NUMERIC(12,2)
            );
        """)
        print("✓ Created transaction_items table")
        
        # Create PAYMENTS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER,
                amount NUMERIC(12,2),
                payment_type payment_type,
                status payment_status,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created payments table")
        
        # Create CREDITS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                shop_id INTEGER,
                amount NUMERIC(12,2),
                status VARCHAR(20),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ Created credits table")
        
        # Now add foreign key constraints
        print("Adding foreign key constraints...")
        
        # Add foreign keys to users table
        cursor.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_users_shop_id'
                ) THEN
                    ALTER TABLE users ADD CONSTRAINT fk_users_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_users_created_by'
                ) THEN
                    ALTER TABLE users ADD CONSTRAINT fk_users_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id);
                END IF;
            END $$;
        """)
        
        # Add foreign key to shops table
        cursor.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_shops_owner_id'
                ) THEN
                    ALTER TABLE shops ADD CONSTRAINT fk_shops_owner_id 
                    FOREIGN KEY (owner_id) REFERENCES users(id);
                END IF;
            END $$;
        """)
        
        # Add foreign keys to products table
        cursor.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_products_category_id'
                ) THEN
                    ALTER TABLE products ADD CONSTRAINT fk_products_category_id 
                    FOREIGN KEY (category_id) REFERENCES categories(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_products_shop_id'
                ) THEN
                    ALTER TABLE products ADD CONSTRAINT fk_products_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
            END $$;
        """)
        
        # Add remaining foreign keys
        cursor.execute("""
            DO $$ 
            BEGIN 
                -- shop_products foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_shop_products_shop_id'
                ) THEN
                    ALTER TABLE shop_products ADD CONSTRAINT fk_shop_products_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_shop_products_product_id'
                ) THEN
                    ALTER TABLE shop_products ADD CONSTRAINT fk_shop_products_product_id 
                    FOREIGN KEY (product_id) REFERENCES products(id);
                END IF;
                
                -- farmer_stock foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_farmer_stock_farmer_id'
                ) THEN
                    ALTER TABLE farmer_stock ADD CONSTRAINT fk_farmer_stock_farmer_id 
                    FOREIGN KEY (farmer_id) REFERENCES users(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_farmer_stock_shop_id'
                ) THEN
                    ALTER TABLE farmer_stock ADD CONSTRAINT fk_farmer_stock_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_farmer_stock_product_id'
                ) THEN
                    ALTER TABLE farmer_stock ADD CONSTRAINT fk_farmer_stock_product_id 
                    FOREIGN KEY (product_id) REFERENCES products(id);
                END IF;
            END $$;
        """)
        
        cursor.execute("""
            DO $$ 
            BEGIN 
                -- transactions foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_transactions_shop_id'
                ) THEN
                    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_transactions_buyer_id'
                ) THEN
                    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_buyer_id 
                    FOREIGN KEY (buyer_id) REFERENCES users(id);
                END IF;
                
                -- transaction_items foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_transaction_items_transaction_id'
                ) THEN
                    ALTER TABLE transaction_items ADD CONSTRAINT fk_transaction_items_transaction_id 
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_transaction_items_product_id'
                ) THEN
                    ALTER TABLE transaction_items ADD CONSTRAINT fk_transaction_items_product_id 
                    FOREIGN KEY (product_id) REFERENCES products(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_transaction_items_farmer_stock_id'
                ) THEN
                    ALTER TABLE transaction_items ADD CONSTRAINT fk_transaction_items_farmer_stock_id 
                    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id);
                END IF;
            END $$;
        """)
        
        cursor.execute("""
            DO $$ 
            BEGIN 
                -- payments foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_payments_transaction_id'
                ) THEN
                    ALTER TABLE payments ADD CONSTRAINT fk_payments_transaction_id 
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id);
                END IF;
                
                -- credits foreign keys
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_credits_user_id'
                ) THEN
                    ALTER TABLE credits ADD CONSTRAINT fk_credits_user_id 
                    FOREIGN KEY (user_id) REFERENCES users(id);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_credits_shop_id'
                ) THEN
                    ALTER TABLE credits ADD CONSTRAINT fk_credits_shop_id 
                    FOREIGN KEY (shop_id) REFERENCES shops(id);
                END IF;
            END $$;
        """)
        
        print("✓ Added foreign key constraints")
        
        # Create alembic version table to mark this migration as done
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            );
        """)
        
        # Mark the migration as completed
        cursor.execute("""
            INSERT INTO alembic_version (version_num) 
            VALUES ('20250901_full_core_tables') 
            ON CONFLICT (version_num) DO NOTHING;
        """)
        
        print("✓ Created alembic_version table and marked migration as complete")
        
        cursor.close()
        conn.close()
        print("✅ Database schema created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating schema: {e}")

if __name__ == "__main__":
    create_schema()
