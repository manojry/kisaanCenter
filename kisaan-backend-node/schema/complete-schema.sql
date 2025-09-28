-- =============================================
-- KisaanCenter Complete Database Schema
-- Version: 1.0.0
-- Generated from existing production schema
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- =============================================
-- ENUMS SECTION
-- =============================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_users_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User status enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_users_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Shop status enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_shops_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment enums
DO $$ BEGIN
    CREATE TYPE enum_kisaan_payments_payer_type AS ENUM ('farmer', 'buyer', 'shop', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_kisaan_payments_payee_type AS ENUM ('farmer', 'buyer', 'shop', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_kisaan_payments_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_kisaan_payments_method AS ENUM ('cash', 'upi', 'bank_transfer', 'card', 'cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Commission type enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_commissions_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Credit status enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_credits_status AS ENUM ('active', 'repaid', 'overdue', 'written_off');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Settlement enums
DO $$ BEGIN
    CREATE TYPE enum_kisaan_settlements_reason AS ENUM ('overpayment', 'underpayment', 'adjustment', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_kisaan_settlements_status AS ENUM ('pending', 'settled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Plans billing cycle enum
DO $$ BEGIN
    CREATE TYPE enum_kisaan_plans_billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- SEQUENCES SECTION
-- =============================================

-- Create sequences for tables
CREATE SEQUENCE IF NOT EXISTS kisaan_plans_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_categories_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_users_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_shops_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_products_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_transactions_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_payments_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_commissions_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_shop_categories_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_shop_products_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_credits_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_plan_usage_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_audit_logs_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_payment_allocations_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_settlements_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS kisaan_balance_snapshots_id_seq START 1;

-- =============================================
-- CORE TABLES SECTION
-- =============================================

-- Plans table (foundational)
CREATE TABLE IF NOT EXISTS kisaan_plans (
    id INTEGER DEFAULT nextval('kisaan_plans_id_seq') NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    billing_cycle enum_kisaan_plans_billing_cycle DEFAULT 'monthly',
    monthly_price NUMERIC(10,2),
    quarterly_price NUMERIC(10,2),
    yearly_price NUMERIC(10,2),
    max_farmers INTEGER,
    max_buyers INTEGER,
    max_transactions INTEGER,
    data_retention_months INTEGER,
    features TEXT DEFAULT '[]' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT kisaan_plans_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_plans_name_key UNIQUE (name)
);

-- Categories table (foundational)
CREATE TABLE IF NOT EXISTS kisaan_categories (
    id INTEGER DEFAULT nextval('kisaan_categories_id_seq') NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT kisaan_categories_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_categories_name_key UNIQUE (name)
);

-- Ensure display_order column exists for categories
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='kisaan_categories' AND column_name='display_order'
    ) THEN
        ALTER TABLE kisaan_categories ADD COLUMN display_order INTEGER NULL;
    END IF;
END $$;

-- Users table (foundational - self-referencing)
CREATE TABLE IF NOT EXISTS kisaan_users (
    id BIGINT DEFAULT nextval('kisaan_users_id_seq') NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(255),
    email VARCHAR(255),
    contact VARCHAR(255),
    role enum_kisaan_users_role NOT NULL,
    shop_id BIGINT,
    status enum_kisaan_users_status DEFAULT 'active' NOT NULL,
    balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
    cumulative_value NUMERIC(18,2) DEFAULT 0 NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT kisaan_users_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_users_username_key UNIQUE (username)
);

-- Ensure custom_commission_rate column (nullable percentage override) exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='kisaan_users' AND column_name='custom_commission_rate'
    ) THEN
        ALTER TABLE kisaan_users ADD COLUMN custom_commission_rate NUMERIC(5,2) NULL;
    END IF;
END $$;

-- Shops table (depends on users for owner)
CREATE TABLE IF NOT EXISTS kisaan_shops (
    id BIGINT DEFAULT nextval('kisaan_shops_id_seq') NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_id BIGINT NOT NULL,
    plan_id INTEGER,
    address TEXT,
    contact VARCHAR(255),
    status enum_kisaan_shops_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_shops_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES kisaan_users(id),
    CONSTRAINT kisaan_shops_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES kisaan_plans(id)
);

-- Add the shop_id foreign key to users (circular reference handled)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'kisaan_users_shop_id_fkey') THEN
        ALTER TABLE kisaan_users ADD CONSTRAINT kisaan_users_shop_id_fkey 
        FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Add created_by foreign key to users
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'kisaan_users_created_by_fkey') THEN
        ALTER TABLE kisaan_users ADD CONSTRAINT kisaan_users_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES kisaan_users(id);
    END IF;
END $$;

-- Products table
CREATE TABLE IF NOT EXISTS kisaan_products (
    id INTEGER DEFAULT nextval('kisaan_products_id_seq') NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT,
    unit VARCHAR(20),
    record_status VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT kisaan_products_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES kisaan_categories(id)
);

-- Backward cleanup: drop legacy price column if still present
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='kisaan_products' AND column_name='price'
    ) THEN
        EXECUTE 'ALTER TABLE kisaan_products DROP COLUMN price';
    END IF;
END $$;

-- Drop legacy status column if still present (catalog no longer uses product status)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='kisaan_products' AND column_name='status'
    ) THEN
        EXECUTE 'ALTER TABLE kisaan_products DROP COLUMN status';
    END IF;
END $$;

-- =============================================
-- BUSINESS LOGIC TABLES
-- =============================================

-- Transactions table
CREATE TABLE IF NOT EXISTS kisaan_transactions (
    id INTEGER DEFAULT nextval('kisaan_transactions_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    farmer_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    category_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    farmer_earning NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_transactions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id),
    CONSTRAINT kisaan_transactions_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES kisaan_users(id),
    CONSTRAINT kisaan_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES kisaan_users(id),
    CONSTRAINT kisaan_transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES kisaan_categories(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS kisaan_payments (
    id BIGINT DEFAULT nextval('kisaan_payments_id_seq') NOT NULL,
    transaction_id INTEGER,
    shop_id BIGINT,
    counterparty_id INTEGER,
    payer_type enum_kisaan_payments_payer_type NOT NULL,
    payee_type enum_kisaan_payments_payee_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status enum_kisaan_payments_status DEFAULT 'PENDING' NOT NULL,
    payment_date TIMESTAMPTZ,
    method enum_kisaan_payments_method NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_payments_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES kisaan_transactions(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT kisaan_payments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT kisaan_payments_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES kisaan_users(id)
);

-- Commissions table
CREATE TABLE IF NOT EXISTS kisaan_commissions (
    id BIGINT DEFAULT nextval('kisaan_commissions_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    type enum_kisaan_commissions_type DEFAULT 'percentage' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_commissions_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_commissions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id)
);

-- =============================================
-- RELATIONSHIP TABLES
-- =============================================

-- Shop Categories mapping
CREATE TABLE IF NOT EXISTS kisaan_shop_categories (
    id INTEGER DEFAULT nextval('kisaan_shop_categories_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    category_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_shop_categories_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_shop_categories_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id),
    CONSTRAINT kisaan_shop_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES kisaan_categories(id)
);

-- Shop Products mapping
CREATE TABLE IF NOT EXISTS kisaan_shop_products (
    id INTEGER DEFAULT nextval('kisaan_shop_products_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    product_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_shop_products_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_shop_products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id),
    CONSTRAINT kisaan_shop_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES kisaan_products(id)
);

-- =============================================
-- FINANCIAL TABLES
-- =============================================

-- Credits table
CREATE TABLE IF NOT EXISTS kisaan_credits (
    id BIGINT DEFAULT nextval('kisaan_credits_id_seq') NOT NULL,
    user_id BIGINT NOT NULL,
    shop_id BIGINT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    issued_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    repaid_amount NUMERIC(10,2) DEFAULT 0 NOT NULL,
    status enum_kisaan_credits_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT kisaan_credits_pkey PRIMARY KEY (id)
);

-- Settlements table
CREATE TABLE IF NOT EXISTS kisaan_settlements (
    id BIGINT DEFAULT nextval('kisaan_settlements_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_id INTEGER,
    amount NUMERIC(10,2) NOT NULL,
    reason enum_kisaan_settlements_reason NOT NULL,
    status enum_kisaan_settlements_status DEFAULT 'pending' NOT NULL,
    settlement_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT kisaan_settlements_pkey PRIMARY KEY (id)
);

-- Payment Allocations table (prefixed)
CREATE TABLE IF NOT EXISTS kisaan_payment_allocations (
    id INTEGER DEFAULT nextval('kisaan_payment_allocations_id_seq') NOT NULL,
    payment_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    allocated_amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_payment_allocations_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES kisaan_payments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT kisaan_payment_allocations_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES kisaan_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Balance Snapshots table (prefixed)
CREATE TABLE IF NOT EXISTS kisaan_balance_snapshots (
    id INTEGER DEFAULT nextval('kisaan_balance_snapshots_id_seq') NOT NULL,
    user_id BIGINT NOT NULL,
    balance_type VARCHAR(20) NOT NULL,
    balance NUMERIC(16,4),
    previous_balance NUMERIC(16,4) DEFAULT 0.00 NOT NULL,
    amount_change NUMERIC(16,4) DEFAULT 0.00 NOT NULL,
    new_balance NUMERIC(16,4) DEFAULT 0.00 NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(40),
    description TEXT,
    snapshot_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_balance_snapshots_pkey PRIMARY KEY (id)
);

-- =============================================
-- ADMINISTRATION TABLES
-- =============================================

-- Plan Usage tracking
CREATE TABLE IF NOT EXISTS kisaan_plan_usage (
    id BIGINT DEFAULT nextval('kisaan_plan_usage_id_seq') NOT NULL,
    shop_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    current_farmers INTEGER DEFAULT 0 NOT NULL,
    current_buyers INTEGER DEFAULT 0 NOT NULL,
    current_transactions INTEGER DEFAULT 0 NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    createdAt TIMESTAMPTZ NOT NULL,
    updatedAt TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT kisaan_plan_usage_pkey PRIMARY KEY (id)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS kisaan_audit_logs (
    id BIGINT DEFAULT nextval('kisaan_audit_logs_id_seq') NOT NULL,
    shop_id BIGINT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT kisaan_audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_audit_logs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON DELETE SET NULL,
    CONSTRAINT kisaan_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES kisaan_users(id) ON DELETE SET NULL
);

-- Migration tracking table (Sequelize compatibility)
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
    name VARCHAR(255) NOT NULL,
    CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name)
);

-- =============================================
-- COMMENTS SECTION
-- =============================================

COMMENT ON COLUMN kisaan_users.cumulative_value IS 'Cumulative value: total earned (farmer), total spent (buyer), total commission (owner)';

-- =============================================
-- FEATURE GATING TABLES (Plan / User Overrides)
-- =============================================

-- Features master list
CREATE TABLE IF NOT EXISTS kisaan_features (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(60) NOT NULL,
        description TEXT,
        default_enabled BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Plan level feature enable/disable (normalized replacement for plans.features JSON)
CREATE TABLE IF NOT EXISTS kisaan_plan_features (
        plan_id INTEGER NOT NULL REFERENCES kisaan_plans(id) ON DELETE CASCADE,
        feature_code VARCHAR(100) NOT NULL REFERENCES kisaan_features(code) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT kisaan_plan_features_pkey PRIMARY KEY (plan_id, feature_code)
);
CREATE INDEX IF NOT EXISTS idx_kisaan_plan_features_plan ON kisaan_plan_features(plan_id);

-- User specific overrides (superadmin controlled)
CREATE TABLE IF NOT EXISTS kisaan_user_feature_overrides (
        user_id BIGINT NOT NULL REFERENCES kisaan_users(id) ON DELETE CASCADE,
        feature_code VARCHAR(100) NOT NULL REFERENCES kisaan_features(code) ON DELETE CASCADE,
        enabled BOOLEAN NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT kisaan_user_feature_overrides_pkey PRIMARY KEY (user_id, feature_code)
);
CREATE INDEX IF NOT EXISTS idx_kisaan_user_feature_overrides_user ON kisaan_user_feature_overrides(user_id);

-- Seed minimal feature set (idempotent)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM kisaan_features WHERE code = 'transactions.history.full') THEN
        INSERT INTO kisaan_features(code,name,category,description,default_enabled) VALUES
        ('transactions.history.full','Full Transaction History','transactions','Access more than limited retention window', false),
        ('reports.generate','Generate Reports','reports','Generate on-screen / JSON reports', true),
        ('reports.download','Download Reports','reports','Download PDF/Excel reports', false),
        ('data.retention.unlimited','Unlimited Data Retention','data','Bypass standard data retention caps', false);
END IF; END $$;

-- Backfill plan feature mapping from existing plans.features JSON (one-time opportunistic)
DO $$ DECLARE r RECORD; f TEXT; arr JSON; BEGIN
    FOR r IN SELECT id, features FROM kisaan_plans LOOP
        BEGIN
            arr := COALESCE(NULLIF(r.features,''),'[]')::json;
            FOR f IN SELECT json_array_elements_text(arr) LOOP
                INSERT INTO kisaan_plan_features(plan_id, feature_code, enabled)
                SELECT r.id, f, true
                ON CONFLICT (plan_id, feature_code) DO NOTHING;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END LOOP;
END $$;

-- =============================================
-- END OF SCHEMA
-- =============================================