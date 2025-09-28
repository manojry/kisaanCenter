-- =============================================
-- Core Business Entities Module
-- Contains: Users, Shops, Plans, Categories
-- =============================================

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