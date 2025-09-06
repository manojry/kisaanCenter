-- Comprehensive cleanup script for all leftover constraints and indexes
-- Run this in your PostgreSQL database before attempting migrations

-- Drop all foreign key constraints
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS kisaan_credits_user_id_fkey;
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS kisaan_credits_shop_id_fkey;
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS kisaan_credits_plan_id_fkey;

ALTER TABLE kisaan_payments DROP CONSTRAINT IF EXISTS kisaan_payments_user_id_fkey;
ALTER TABLE kisaan_payments DROP CONSTRAINT IF EXISTS kisaan_payments_shop_id_fkey;
ALTER TABLE kisaan_payments DROP CONSTRAINT IF EXISTS kisaan_payments_transaction_id_fkey;
ALTER TABLE kisaan_payments DROP CONSTRAINT IF EXISTS kisaan_payments_credit_id_fkey;

ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS kisaan_transactions_user_id_fkey;
ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS kisaan_transactions_shop_id_fkey;
ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS kisaan_transactions_buyer_id_fkey;
ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS kisaan_transactions_parent_transaction_id_fkey;

ALTER TABLE kisaan_shop_categories DROP CONSTRAINT IF EXISTS kisaan_shop_categories_shop_id_fkey;
ALTER TABLE kisaan_shop_categories DROP CONSTRAINT IF EXISTS kisaan_shop_categories_category_id_fkey;

ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS kisaan_products_category_id_fkey;
ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS kisaan_products_shop_id_fkey;

ALTER TABLE kisaan_shops DROP CONSTRAINT IF EXISTS kisaan_shops_owner_id_fkey;
ALTER TABLE kisaan_shops DROP CONSTRAINT IF EXISTS kisaan_shops_plan_id_fkey;

-- Drop all leftover indexes (with and without quotes)
DROP INDEX IF EXISTS credits_shop_id;
DROP INDEX IF EXISTS "credits_shop_id";
DROP INDEX IF EXISTS kisaan_credits_user_id;
DROP INDEX IF EXISTS "kisaan_credits_user_id";
DROP INDEX IF EXISTS kisaan_credits_shop_id;
DROP INDEX IF EXISTS "kisaan_credits_shop_id";

DROP INDEX IF EXISTS products_shop_id;
DROP INDEX IF EXISTS "products_shop_id";
DROP INDEX IF EXISTS kisaan_products_name;
DROP INDEX IF EXISTS "kisaan_products_name";
DROP INDEX IF EXISTS kisaan_products_category_id;
DROP INDEX IF EXISTS "kisaan_products_category_id";
DROP INDEX IF EXISTS kisaan_products_shop_id;
DROP INDEX IF EXISTS "kisaan_products_shop_id";

DROP INDEX IF EXISTS kisaan_transactions_shop_id;
DROP INDEX IF EXISTS "kisaan_transactions_shop_id";
DROP INDEX IF EXISTS kisaan_transactions_buyer_id;
DROP INDEX IF EXISTS "kisaan_transactions_buyer_id";

DROP INDEX IF EXISTS kisaan_payments_transaction_id;
DROP INDEX IF EXISTS "kisaan_payments_transaction_id";
DROP INDEX IF EXISTS kisaan_payments_credit_id;
DROP INDEX IF EXISTS "kisaan_payments_credit_id";

DROP INDEX IF EXISTS kisaan_shop_categories_shop_id;
DROP INDEX IF EXISTS "kisaan_shop_categories_shop_id";
DROP INDEX IF EXISTS kisaan_shop_categories_category_id;
DROP INDEX IF EXISTS "kisaan_shop_categories_category_id";

-- Drop all leftover constraints (with and without quotes)
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS credits_shop_id;
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS "credits_shop_id";
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS kisaan_credits_user_id;
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS "kisaan_credits_user_id";
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS kisaan_credits_shop_id;
ALTER TABLE kisaan_credits DROP CONSTRAINT IF EXISTS "kisaan_credits_shop_id";

ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS products_shop_id;
ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS "products_shop_id";
ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS kisaan_products_name;
ALTER TABLE kisaan_products DROP CONSTRAINT IF EXISTS "kisaan_products_name";

-- Now drop all tables (CASCADE will handle any remaining dependencies)
DROP TABLE IF EXISTS kisaan_credits CASCADE;
DROP TABLE IF EXISTS kisaan_payments CASCADE;
DROP TABLE IF EXISTS kisaan_transactions CASCADE;
DROP TABLE IF EXISTS kisaan_shop_categories CASCADE;
DROP TABLE IF EXISTS kisaan_products CASCADE;
DROP TABLE IF EXISTS kisaan_plans CASCADE;
DROP TABLE IF EXISTS kisaan_shops CASCADE;
DROP TABLE IF EXISTS kisaan_categories CASCADE;
DROP TABLE IF EXISTS kisaan_users CASCADE;

-- Clear the SequelizeMeta table for a full migration reset
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;
