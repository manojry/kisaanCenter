-- Schema Consolidation and API Alignment Migration
-- Fixes duplicate tables, adds missing tables, defines enums, aligns field names

-- 1. CREATE ENUMS
-- Ensure 'pending' value exists in completion_status enum
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'pending'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'completion_status')
    ) THEN
        ALTER TYPE completion_status ADD VALUE 'pending';
    END IF;
END$;
-- Ensure 'unpaid' value exists in payment_status enum
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'unpaid'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status')
    ) THEN
        ALTER TYPE payment_status ADD VALUE 'unpaid';
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'manager', 'employee', 'farmer', 'buyer');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
        CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'return');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'partial');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('cash', 'card', 'upi', 'bank_transfer');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farmer_payment_type') THEN
        CREATE TYPE farmer_payment_type AS ENUM ('advance', 'final', 'bonus');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_status') THEN
        CREATE TYPE credit_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'completion_status') THEN
        CREATE TYPE completion_status AS ENUM ('pending', 'in_progress', 'complete');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_status') THEN
        CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock', 'low_stock');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
    END IF;
END$;
DO $ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
        CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly');
    END IF;
END$;

-- 2. DROP DUPLICATE TABLES (keep plural versions)
DROP TABLE IF EXISTS credit CASCADE;
DROP TABLE IF EXISTS payment_method CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS farmer_payment CASCADE;

-- 3. CREATE MISSING CORE TABLES

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shops table (rename from shop for consistency)
DROP TABLE IF EXISTS shops CASCADE;
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    location VARCHAR(255),
    contact VARCHAR(15),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    owner_user_id INTEGER,
    plan_id INTEGER,
    plan_start_date DATE,
    plan_end_date DATE,
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Recreate users table with proper enums and foreign keys
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    contact VARCHAR(15),
    shop_id INTEGER,
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    status record_status NOT NULL DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add foreign key constraint for shop owner
ALTER TABLE shops ADD CONSTRAINT fk_shops_owner_user_id 
    FOREIGN KEY (owner_user_id) REFERENCES users(id);

-- Superadmin table
CREATE TABLE IF NOT EXISTS superadmin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recreate products table with category reference
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    price DECIMAL(10,2),
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Farmer stock table
CREATE TABLE IF NOT EXISTS farmer_stock (
    id SERIAL PRIMARY KEY,
    farmer_user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    price DECIMAL(10,2) NOT NULL,
    status stock_status NOT NULL DEFAULT 'in_stock',
    record_status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 4. RECREATE TRANSACTION TABLES WITH PROPER FIELD NAMES

-- Transactions table with buyer_id instead of buyer_user_id
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,  -- Changed from buyer_user_id
    parent_transaction_id INTEGER,
    type transaction_type NOT NULL DEFAULT 'sale',
    status transaction_status NOT NULL DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
    farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
    commission_confirmed BOOLEAN DEFAULT false,
    completion_status completion_status NOT NULL DEFAULT 'pending',
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (parent_transaction_id) REFERENCES transactions(id)
);

-- Transaction items with farmer_id field
DROP TABLE IF EXISTS transaction_items CASCADE;
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    farmer_id INTEGER NOT NULL,  -- Added farmer_id as expected by API
    farmer_stock_id INTEGER,
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farmer_id) REFERENCES users(id),
    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id)
);

-- 5. CONSOLIDATE PAYMENT TABLES (use plural versions only)

-- Payment methods table (consolidated)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credits table (consolidated)
CREATE TABLE IF NOT EXISTS credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status credit_status NOT NULL DEFAULT 'pending',
    record_status record_status NOT NULL DEFAULT 'active',
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments table (consolidated)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    credit_id INTEGER,
    amount DECIMAL(12,2) NOT NULL,
    payment_method_id INTEGER NOT NULL,
    type payment_type NOT NULL,
    status record_status DEFAULT 'active',
    date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Farmer payments table (consolidated)
CREATE TABLE IF NOT EXISTS farmer_payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    farmer_stock_id INTEGER,
    farmer_user_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_type farmer_payment_type NOT NULL,
    payment_method_id INTEGER NOT NULL,
    remarks TEXT,
    date DATE NOT NULL,
    reference_number VARCHAR(100),
    approved_by INTEGER,
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id),
    FOREIGN KEY (farmer_user_id) REFERENCES users(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 6. SUBSCRIPTION TABLES

-- Update plans table with proper enums
ALTER TABLE plans 
    ALTER COLUMN status TYPE record_status USING status::record_status,
    ALTER COLUMN status SET DEFAULT 'active';

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    auto_renew BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    status subscription_status NOT NULL DEFAULT 'active',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Feature control table
CREATE TABLE IF NOT EXISTS feature_control (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
);

-- 7. AUDIT TABLE
CREATE TABLE IF NOT EXISTS farmer_stock_audit (
    id SERIAL PRIMARY KEY,
    farmer_stock_id INTEGER NOT NULL,
    performed_by_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    transaction_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id),
    FOREIGN KEY (performed_by_id) REFERENCES users(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- 8. INSERT DEFAULT DATA

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
    ('Vegetables', 'Fresh vegetables'),
    ('Fruits', 'Fresh fruits'),
    ('Grains', 'Cereals and grains'),
    ('Pulses', 'Lentils and pulses')
ON CONFLICT (name) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, description) VALUES 
    ('Cash', 'Cash payment'),
    ('Card', 'Credit/Debit card payment'),
    ('UPI', 'UPI payment'),
    ('Bank Transfer', 'Bank transfer payment')
ON CONFLICT (name) DO NOTHING;

-- Insert default plan
INSERT INTO plans (name, description, monthly_price, max_farmers, max_buyers, max_transactions, data_retention_months, features, status, created_at, updated_at) VALUES 
    ('Basic Plan', 'Basic subscription plan', 999.00, 50, 100, 1000, 12, '{"basic_features": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer_user_id ON farmer_stock(farmer_user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_product_id ON farmer_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_farmer_payments_transaction_id ON farmer_payments(transaction_id);