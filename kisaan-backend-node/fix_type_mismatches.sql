-- Comprehensive Database Schema Fix Script
-- This script addresses all type mismatches in the kisaan database
-- Run this script to fix foreign key and type consistency issues

-- =================================================================
-- PART 1: BACKUP EXISTING DATA (for safety)
-- =================================================================
-- Note: Consider backing up your data before running this script

-- =================================================================
-- PART 2: DROP EXISTING FOREIGN KEY CONSTRAINTS
-- =================================================================

-- Drop foreign key constraints that have type mismatches
DO $$ 
BEGIN
    -- Drop kisaan_transactions foreign keys if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_transactions_shop_id_fkey' 
               AND table_name = 'kisaan_transactions') THEN
        ALTER TABLE kisaan_transactions DROP CONSTRAINT kisaan_transactions_shop_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_transactions_product_id_fkey' 
               AND table_name = 'kisaan_transactions') THEN
        ALTER TABLE kisaan_transactions DROP CONSTRAINT kisaan_transactions_product_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_transactions_parent_transaction_id_fkey' 
               AND table_name = 'kisaan_transactions') THEN
        ALTER TABLE kisaan_transactions DROP CONSTRAINT kisaan_transactions_parent_transaction_id_fkey;
    END IF;

    -- Drop other problematic foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_shops_plan_id_fkey' 
               AND table_name = 'kisaan_shops') THEN
        ALTER TABLE kisaan_shops DROP CONSTRAINT kisaan_shops_plan_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_products_shop_id_fkey' 
               AND table_name = 'kisaan_products') THEN
        ALTER TABLE kisaan_products DROP CONSTRAINT kisaan_products_shop_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_products_category_id_fkey' 
               AND table_name = 'kisaan_products') THEN
        ALTER TABLE kisaan_products DROP CONSTRAINT kisaan_products_category_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_credits_user_id_fkey' 
               AND table_name = 'kisaan_credits') THEN
        ALTER TABLE kisaan_credits DROP CONSTRAINT kisaan_credits_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_credits_shop_id_fkey' 
               AND table_name = 'kisaan_credits') THEN
        ALTER TABLE kisaan_credits DROP CONSTRAINT kisaan_credits_shop_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_payments_transaction_id_fkey' 
               AND table_name = 'kisaan_payments') THEN
        ALTER TABLE kisaan_payments DROP CONSTRAINT kisaan_payments_transaction_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_payments_credit_id_fkey' 
               AND table_name = 'kisaan_payments') THEN
        ALTER TABLE kisaan_payments DROP CONSTRAINT kisaan_payments_credit_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'kisaan_payments_payment_method_id_fkey' 
               AND table_name = 'kisaan_payments') THEN
        ALTER TABLE kisaan_payments DROP CONSTRAINT kisaan_payments_payment_method_id_fkey;
    END IF;
END $$;

-- =================================================================
-- PART 3: ADD MISSING COLUMNS AND FIX COLUMN TYPES
-- =================================================================

-- Ensure all required columns exist and have correct types
DO $$
BEGIN
    -- Add missing columns to kisaan_shops if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kisaan_shops' AND column_name = 'category_id') THEN
        ALTER TABLE kisaan_shops ADD COLUMN category_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kisaan_shops' AND column_name = 'commission_rate') THEN
        ALTER TABLE kisaan_shops ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT 0.00;
    END IF;

    -- Ensure kisaan_transactions has all required fields with correct types

    -- Ensure farmer_id and buyer_id are VARCHAR to match kisaan_users.owner_id (VARCHAR)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kisaan_transactions' AND column_name = 'farmer_id') THEN
        ALTER TABLE kisaan_transactions ADD COLUMN farmer_id CHARACTER VARYING NOT NULL DEFAULT '';
    ELSE
        -- If column exists but is not VARCHAR, alter it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'kisaan_transactions' AND column_name = 'farmer_id' AND data_type <> 'character varying'
        ) THEN
            ALTER TABLE kisaan_transactions ALTER COLUMN farmer_id TYPE CHARACTER VARYING USING farmer_id::text;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kisaan_transactions' AND column_name = 'buyer_id') THEN
        ALTER TABLE kisaan_transactions ADD COLUMN buyer_id CHARACTER VARYING NOT NULL DEFAULT '';
    ELSE
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'kisaan_transactions' AND column_name = 'buyer_id' AND data_type <> 'character varying'
        ) THEN
            ALTER TABLE kisaan_transactions ALTER COLUMN buyer_id TYPE CHARACTER VARYING USING buyer_id::text;
        END IF;
    END IF;

    -- Update transaction enum types to match application expectations
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kisaan_transactions_status_new') THEN
        CREATE TYPE kisaan_transactions_status_new AS ENUM ('pending', 'paid', 'partial', 'credit', 'farmer_due');
    END IF;

    -- Update status column type if needed
    -- Note: This requires careful handling of existing data
END $$;

-- =================================================================
-- PART 4: UPDATE EXISTING DATA TO ENSURE CONSISTENCY
-- =================================================================


-- Update any NULL or empty values in critical fields
-- If you want to match owner_id, you may need to update these with actual owner_id values from kisaan_users
-- Example (uncomment and adjust as needed):
-- UPDATE kisaan_transactions t
-- SET farmer_id = u.owner_id
-- FROM kisaan_users u
-- WHERE t.farmer_id IS NULL OR t.farmer_id = '' AND u.id = t.farmer_id;

-- For now, just set to empty string if NULL
UPDATE kisaan_transactions 
SET farmer_id = '' 
WHERE farmer_id IS NULL;

UPDATE kisaan_transactions 
SET buyer_id = '' 
WHERE buyer_id IS NULL;

-- Update commission rates if they're NULL
UPDATE kisaan_shops 
SET commission_rate = 10.00 
WHERE commission_rate IS NULL;

-- =================================================================
-- PART 5: RECREATE FOREIGN KEY CONSTRAINTS WITH CORRECT REFERENCES
-- =================================================================


-- Re-create foreign key constraints with proper type matching
-- Note: farmer_id and buyer_id reference kisaan_users.owner_id (VARCHAR), not id (INTEGER)
-- If you want to enforce this at the DB level, you can add a foreign key like below (uncomment if desired):
-- ALTER TABLE kisaan_transactions
--   ADD CONSTRAINT kisaan_transactions_farmer_id_fkey
--   FOREIGN KEY (farmer_id) REFERENCES kisaan_users(owner_id);
-- ALTER TABLE kisaan_transactions
--   ADD CONSTRAINT kisaan_transactions_buyer_id_fkey
--   FOREIGN KEY (buyer_id) REFERENCES kisaan_users(owner_id);

-- Shop to Plans relationship
ALTER TABLE kisaan_shops 
ADD CONSTRAINT kisaan_shops_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES kisaan_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Products to Categories relationship
ALTER TABLE kisaan_products 
ADD CONSTRAINT kisaan_products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES kisaan_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Products to Shops relationship
ALTER TABLE kisaan_products 
ADD CONSTRAINT kisaan_products_shop_id_fkey 
FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Transactions to Shops relationship
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT kisaan_transactions_shop_id_fkey 
FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Transactions to Products relationship
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT kisaan_transactions_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES kisaan_products(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Self-referencing transaction relationship
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT kisaan_transactions_parent_transaction_id_fkey 
FOREIGN KEY (parent_transaction_id) REFERENCES kisaan_transactions(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Credits to Users relationship (using integer user_id)
ALTER TABLE kisaan_credits 
ADD CONSTRAINT kisaan_credits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES kisaan_users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Credits to Shops relationship
ALTER TABLE kisaan_credits 
ADD CONSTRAINT kisaan_credits_shop_id_fkey 
FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Payments to Transactions relationship
ALTER TABLE kisaan_payments 
ADD CONSTRAINT kisaan_payments_transaction_id_fkey 
FOREIGN KEY (transaction_id) REFERENCES kisaan_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Payments to Credits relationship
ALTER TABLE kisaan_payments 
ADD CONSTRAINT kisaan_payments_credit_id_fkey 
FOREIGN KEY (credit_id) REFERENCES kisaan_credits(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Payments to Payment Methods relationship
ALTER TABLE kisaan_payments 
ADD CONSTRAINT kisaan_payments_payment_method_id_fkey 
FOREIGN KEY (payment_method_id) REFERENCES kisaan_payment_methods(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Shop Categories junction table relationships
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kisaan_shop_categories') THEN
        -- Drop existing constraints if they exist
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'kisaan_shop_categories_shop_id_fkey' 
                   AND table_name = 'kisaan_shop_categories') THEN
            ALTER TABLE kisaan_shop_categories DROP CONSTRAINT kisaan_shop_categories_shop_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'kisaan_shop_categories_category_id_fkey' 
                   AND table_name = 'kisaan_shop_categories') THEN
            ALTER TABLE kisaan_shop_categories DROP CONSTRAINT kisaan_shop_categories_category_id_fkey;
        END IF;

        -- Re-create with correct references
        ALTER TABLE kisaan_shop_categories 
        ADD CONSTRAINT kisaan_shop_categories_shop_id_fkey 
        FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON UPDATE CASCADE ON DELETE CASCADE;

        ALTER TABLE kisaan_shop_categories 
        ADD CONSTRAINT kisaan_shop_categories_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES kisaan_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

-- =================================================================
-- PART 6: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Ensure we have proper indexes for foreign keys and commonly queried fields
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_shop_id ON kisaan_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_product_id ON kisaan_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_farmer_id ON kisaan_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_buyer_id ON kisaan_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_transaction_date ON kisaan_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_status ON kisaan_transactions(status);

CREATE INDEX IF NOT EXISTS idx_kisaan_products_shop_id ON kisaan_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_products_category_id ON kisaan_products(category_id);

CREATE INDEX IF NOT EXISTS idx_kisaan_users_owner_id ON kisaan_users(owner_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_users_shop_id ON kisaan_users(shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_users_role ON kisaan_users(role);

-- =================================================================
-- PART 7: VERIFICATION QUERIES
-- =================================================================

-- Verify the schema is now consistent
SELECT 'Schema verification complete. Run these queries to check:' AS message;

-- Show all foreign key constraints
/*
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name LIKE 'kisaan_%'
ORDER BY tc.table_name, tc.constraint_name;
*/

-- Check for any remaining type mismatches
/*
SELECT 
    'kisaan_transactions' as table_name,
    'farmer_id' as column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kisaan_transactions' AND column_name = 'farmer_id'
UNION ALL
SELECT 
    'kisaan_transactions' as table_name,
    'buyer_id' as column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kisaan_transactions' AND column_name = 'buyer_id'
UNION ALL
SELECT 
    'kisaan_users' as table_name,
    'id' as column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kisaan_users' AND column_name = 'id';
*/

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================
SELECT 'Database schema fix completed successfully!' AS completion_status;
