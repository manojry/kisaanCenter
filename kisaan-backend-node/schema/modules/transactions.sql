-- =============================================
-- Transaction & Payment Module
-- Contains: Transactions, Payments, Payment Allocations
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

-- Payment Allocations table
CREATE TABLE IF NOT EXISTS kisaan_payment_allocations (
    id INTEGER DEFAULT nextval('payment_allocations_id_seq') NOT NULL,
    payment_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    allocated_amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT kisaan_payment_allocations_pkey PRIMARY KEY (id),
    CONSTRAINT kisaan_payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES kisaan_payments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT kisaan_payment_allocations_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES kisaan_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE
);