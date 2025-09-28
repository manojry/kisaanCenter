-- =============================================
-- KisaanCenter Database Indexes
-- Optimized for performance and query patterns
-- =============================================

-- =============================================
-- UNIQUE INDEXES (Primary Keys handled by schema)
-- =============================================

-- Users table indexes
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_users_username_unique ON kisaan_users USING btree (username);

-- Shop Categories unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_shop_categories_shop_category_unique 
ON kisaan_shop_categories USING btree (shop_id, category_id);

-- Shop Products unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_shop_products_shop_product_unique 
ON kisaan_shop_products USING btree (shop_id, product_id);

-- Products name per category unique
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_products_name_category_unique 
ON kisaan_products USING btree (name, category_id);

-- Categories name unique
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_categories_name_unique ON kisaan_categories USING btree (name);

-- Plans name unique
CREATE UNIQUE INDEX IF NOT EXISTS kisaan_plans_name_unique ON kisaan_plans USING btree (name);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users table performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_users_shop_id ON kisaan_users USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_users_role ON kisaan_users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_kisaan_users_status ON kisaan_users USING btree (status);
-- Adjusted to avoid enum=text operator mismatch on some Postgres configurations
CREATE INDEX IF NOT EXISTS idx_kisaan_users_shop_role 
ON kisaan_users USING btree (shop_id) WHERE role IN ('owner','farmer','buyer');

-- Shops table performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_shops_owner_id ON kisaan_shops USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shops_plan_id ON kisaan_shops USING btree (plan_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shops_status ON kisaan_shops USING btree (status);

-- Products table performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_products_category_id ON kisaan_products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_products_status ON kisaan_products USING btree (record_status);

-- Transactions table performance indexes (heavily queried)
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_shop_id ON kisaan_transactions USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_farmer_id ON kisaan_transactions USING btree (farmer_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_buyer_id ON kisaan_transactions USING btree (buyer_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_category_id ON kisaan_transactions USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_created_at ON kisaan_transactions USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_shop_date ON kisaan_transactions USING btree (shop_id, created_at);

-- Payments table performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_transaction_id ON kisaan_payments USING btree (transaction_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_shop_id ON kisaan_payments USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_counterparty_id ON kisaan_payments USING btree (counterparty_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_payer_type ON kisaan_payments USING btree (payer_type);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_payee_type ON kisaan_payments USING btree (payee_type);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_status ON kisaan_payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_payment_date ON kisaan_payments USING btree (payment_date);
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_transaction_status ON kisaan_payments USING btree (transaction_id, status);

-- Commissions table performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_commissions_shop_id ON kisaan_commissions USING btree (shop_id);

-- Shop Categories performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_categories_shop_id ON kisaan_shop_categories USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_categories_category_id ON kisaan_shop_categories USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_categories_is_active ON kisaan_shop_categories USING btree (is_active);

-- Shop Products performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_products_shop_id ON kisaan_shop_products USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_products_product_id ON kisaan_shop_products USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_shop_products_is_active ON kisaan_shop_products USING btree (is_active);

-- Credits performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_credits_user_id ON kisaan_credits USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_credits_shop_id ON kisaan_credits USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_credits_status ON kisaan_credits USING btree (status);
CREATE INDEX IF NOT EXISTS idx_kisaan_credits_due_date ON kisaan_credits USING btree (due_date);

-- Settlements performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_settlements_shop_id ON kisaan_settlements USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_settlements_user_id ON kisaan_settlements USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_settlements_status ON kisaan_settlements USING btree (status);
CREATE INDEX IF NOT EXISTS idx_kisaan_settlements_created_at ON kisaan_settlements USING btree (created_at);

-- Payment Allocations performance indexes
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_transaction_id ON payment_allocations USING btree (transaction_id);

-- Balance Snapshots performance indexes
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_id ON balance_snapshots USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_snapshot_date ON balance_snapshots USING btree (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_date ON balance_snapshots USING btree (user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_reference ON balance_snapshots USING btree (reference_id, reference_type);

-- Plan Usage performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_plan_usage_shop_id ON kisaan_plan_usage USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_plan_usage_plan_id ON kisaan_plan_usage USING btree (plan_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_plan_usage_period ON kisaan_plan_usage USING btree (period_start, period_end);

-- Audit Logs performance indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_shop_id ON kisaan_audit_logs USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_user_id ON kisaan_audit_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_entity_type ON kisaan_audit_logs USING btree (entity_type);
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_action ON kisaan_audit_logs USING btree (action);
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_created_at ON kisaan_audit_logs USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_kisaan_audit_logs_entity_type_id ON kisaan_audit_logs USING btree (entity_type, entity_id);

-- =============================================
-- PARTIAL INDEXES (Condition-based optimization)
-- =============================================

-- Active records only indexes
CREATE INDEX IF NOT EXISTS idx_kisaan_users_active ON kisaan_users USING btree (id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_kisaan_shops_active ON kisaan_shops USING btree (id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_kisaan_plans_active ON kisaan_plans USING btree (id) WHERE is_active = true;

-- Pending payments optimization
CREATE INDEX IF NOT EXISTS idx_kisaan_payments_pending ON kisaan_payments USING btree (created_at) WHERE status = 'PENDING';

-- Active credits optimization
CREATE INDEX IF NOT EXISTS idx_kisaan_credits_active ON kisaan_credits USING btree (user_id, shop_id) WHERE status = 'active';

-- Pending settlements optimization
CREATE INDEX IF NOT EXISTS idx_kisaan_settlements_pending ON kisaan_settlements USING btree (shop_id, user_id) WHERE status = 'pending';

-- =============================================
-- COMPOSITE INDEXES (Multi-column optimization)
-- =============================================

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_shop_farmer_date ON kisaan_transactions USING btree (shop_id, farmer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_buyer_date ON kisaan_transactions USING btree (shop_id, buyer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_shop_status_date ON kisaan_payments USING btree (shop_id, status, payment_date);
CREATE INDEX IF NOT EXISTS idx_users_shop_role_status ON kisaan_users USING btree (shop_id, role, status);

-- =============================================
-- END OF INDEXES
-- =============================================