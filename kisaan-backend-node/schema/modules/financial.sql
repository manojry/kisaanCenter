-- =============================================
-- Financial Management Module
-- Contains: Credits, Settlements, Commissions, Balance Snapshots
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

-- Balance Snapshots table
CREATE TABLE IF NOT EXISTS kisaan_balance_snapshots (
    id INTEGER DEFAULT nextval('balance_snapshots_id_seq') NOT NULL,
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