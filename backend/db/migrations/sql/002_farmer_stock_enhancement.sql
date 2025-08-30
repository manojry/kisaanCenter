-- Create farmerstockmode enum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farmerstockmode') THEN CREATE TYPE farmerstockmode AS ENUM ('declared', 'implicit'); END IF; END $$;

-- Create auditaction enum
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auditaction') THEN CREATE TYPE auditaction AS ENUM ('declare', 'sale', 'update', 'late_declare', 'carry_forward', 'correction'); END IF; END $$;

-- Update farmer_stock table
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS mode farmerstockmode NOT NULL DEFAULT 'implicit';
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS declared_at TIMESTAMP;
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS declared_by_id INTEGER;
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS carry_forward BOOLEAN DEFAULT FALSE;
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS carried_from_date DATE;
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add foreign key for declared_by
ALTER TABLE farmer_stock ADD CONSTRAINT fk_farmer_stock_declared_by FOREIGN KEY (declared_by_id) REFERENCES users(id);

-- Create unique constraint
ALTER TABLE farmer_stock ADD CONSTRAINT uq_farmer_stock_daily UNIQUE (farmer_user_id, product_id, entry_date, shop_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_farmer_stock_lookup ON farmer_stock(farmer_user_id, product_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_shop_date ON farmer_stock(shop_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_mode ON farmer_stock(mode, entry_date);

-- Create farmer_stock_audit table
CREATE TABLE IF NOT EXISTS farmer_stock_audit (
    id SERIAL PRIMARY KEY,
    farmer_stock_id INTEGER NOT NULL REFERENCES farmer_stock(id),
    performed_by_id INTEGER NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    transaction_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create audit indexes
CREATE INDEX IF NOT EXISTS idx_farmer_stock_audit_fsid ON farmer_stock_audit(farmer_stock_id);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_audit_performed_by ON farmer_stock_audit(performed_by_id);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_audit_action ON farmer_stock_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_audit_created_at ON farmer_stock_audit(created_at);
