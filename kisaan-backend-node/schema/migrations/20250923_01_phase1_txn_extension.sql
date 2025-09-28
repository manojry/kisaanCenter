-- Phase 1 Migration: Transaction extensibility & product normalization foundation
-- Date: 2025-09-23
-- Goal: Add additive, non-breaking columns to support future normalization & ledger work.
-- Safe to run multiple times (idempotent guards where feasible).

BEGIN;

-- 1. Products table (basic). Using prefix for consistency.
CREATE TABLE IF NOT EXISTS kisaan_products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    shop_id BIGINT NULL, -- NULL means globally shareable
    unit VARCHAR(32) NULL, -- e.g. KG, QTY, LTR
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT kisaan_products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT kisaan_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES kisaan_categories(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 2. Add new columns to transactions (idempotent per column).
DO $$ BEGIN
    -- product_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='product_id'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN product_id BIGINT NULL;
        ALTER TABLE kisaan_transactions ADD CONSTRAINT kisaan_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES kisaan_products(id) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;

    -- commission_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='commission_rate'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN commission_rate NUMERIC(6,4) NULL;
    END IF;

    -- commission_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='commission_type'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN commission_type VARCHAR(30) NULL;
    END IF;

    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='status'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN status VARCHAR(20) DEFAULT 'posted' NOT NULL;
    END IF;

    -- transaction_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='transaction_date'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN transaction_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- settlement_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='settlement_date'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN settlement_date TIMESTAMPTZ NULL;
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='notes'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN notes TEXT NULL;
    END IF;

    -- metadata (JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='metadata'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN metadata JSONB NULL;
    END IF;

    -- total_amount (duplicate for service alignment)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='total_amount'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN total_amount NUMERIC(12,2) NULL;
    END IF;

    -- commission_amount (duplicate for service alignment)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='kisaan_transactions' AND column_name='commission_amount'
    ) THEN
        ALTER TABLE kisaan_transactions ADD COLUMN commission_amount NUMERIC(12,2) NULL;
    END IF;
END $$;

-- 3. Backfill total_amount / commission_amount / commission_rate from existing economics if available.
UPDATE kisaan_transactions
SET total_amount = COALESCE(total_amount, total_sale_value),
    commission_amount = COALESCE(commission_amount, shop_commission),
    commission_rate = CASE
        WHEN commission_rate IS NOT NULL THEN commission_rate
        WHEN total_sale_value IS NOT NULL AND total_sale_value <> 0 THEN ROUND((shop_commission / total_sale_value) * 100, 4)
        ELSE commission_rate
    END
WHERE (total_amount IS NULL OR commission_amount IS NULL OR commission_rate IS NULL);

-- 4. Indexes (only if not exist - Postgres doesn't support IF NOT EXISTS for regular indexes prior to v15; use safe naming & check catalog).
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_kisaan_transactions_shop_created') THEN
        CREATE INDEX idx_kisaan_transactions_shop_created ON kisaan_transactions (shop_id, created_at DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_kisaan_transactions_farmer_created') THEN
        CREATE INDEX idx_kisaan_transactions_farmer_created ON kisaan_transactions (farmer_id, created_at DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_kisaan_transactions_product') THEN
        CREATE INDEX idx_kisaan_transactions_product ON kisaan_transactions (product_id);
    END IF;
END $$;

COMMIT;

-- Rollback instructions (manual):
--   BEGIN; ALTER TABLE kisaan_transactions DROP COLUMN IF EXISTS commission_amount; ... DROP TABLE IF EXISTS kisaan_products; COMMIT;
--   (Do NOT rollback after dependent code deployed unless coordinated.)
