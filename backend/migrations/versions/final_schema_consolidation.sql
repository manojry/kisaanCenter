-- Final Schema Consolidation Migration
-- Remove all duplicates and establish single source of truth

-- 1. Drop all duplicate and inconsistent tables
DROP TABLE IF EXISTS credit CASCADE;
DROP TABLE IF EXISTS payment_method CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS farmer_payment CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS user CASCADE;
DROP TABLE IF EXISTS shop CASCADE;
DROP TABLE IF EXISTS plan CASCADE;
DROP TABLE IF EXISTS subscription CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS transaction_item CASCADE;
DROP TABLE IF EXISTS farmer_stocks CASCADE;

-- 2. Ensure all enums are properly defined (consolidated versions)
DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE completion_status AS ENUM ('incomplete', 'complete', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE credit_status AS ENUM ('outstanding', 'partial', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('full_payment', 'partial_payment', 'advance', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE farmer_payment_type AS ENUM ('settlement', 'advance', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'return');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock', 'low_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE farmer_stock_mode AS ENUM ('declared', 'implicit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create the final consolidated schema (keep only plural table names for consistency)

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price NUMERIC(10,2) NOT NULL,
    quarterly_price NUMERIC(10,2),
    yearly_price NUMERIC(10,2),
    max_farmers INTEGER NOT NULL,
    max_buyers INTEGER NOT NULL,
    max_transactions INTEGER NOT NULL,
    data_retention_months INTEGER NOT NULL,
    features JSONB,
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    location VARCHAR(255),
    contact VARCHAR(15),
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    owner_user_id INTEGER,
    plan_id INTEGER REFERENCES plans(id),
    plan_start_date DATE,
    plan_end_date DATE,
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    contact VARCHAR(15),
    shop_id INTEGER REFERENCES shops(id),
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    status record_status DEFAULT 'active',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE shops ADD CONSTRAINT fk_shops_owner_user_id 
    FOREIGN KEY (owner_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    price NUMERIC(10,2),
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_stock (
    id SERIAL PRIMARY KEY,
    farmer_user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    declared_qty NUMERIC(10,3),
    sold_qty NUMERIC(10,3) DEFAULT 0.000,
    balance_qty NUMERIC(10,3),
    expired_qty NUMERIC(10,3) DEFAULT 0.000,
    correction_qty NUMERIC(10,3) DEFAULT 0.000,
    price NUMERIC(10,2) NOT NULL,
    status stock_status DEFAULT 'in_stock',
    record_status record_status DEFAULT 'active',
    mode farmer_stock_mode DEFAULT 'implicit',
    declared_at TIMESTAMP,
    declared_by_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    parent_transaction_id INTEGER REFERENCES transactions(id),
    type transaction_type DEFAULT 'sale',
    status transaction_status DEFAULT 'pending',
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    commission_amount NUMERIC(12,2) DEFAULT 0.00,
    payment_status payment_status DEFAULT 'pending',
    buyer_paid_amount NUMERIC(12,2) DEFAULT 0.00,
    farmer_paid_amount NUMERIC(12,2) DEFAULT 0.00,
    commission_confirmed BOOLEAN DEFAULT false,
    completion_status completion_status DEFAULT 'pending',
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables as needed following the same pattern
