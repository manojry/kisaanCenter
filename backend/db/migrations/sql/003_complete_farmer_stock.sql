ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS declared_qty DECIMAL(12,2); -- Complete the farmer stock schema with missing fields
ALTER TABLE farmer_stock ADD COLUMN IF NOT EXISTS sold_qty DECIMAL(12,2);

ALTER TABLE farmer_stock 
    ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS carry_forward BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS carried_from_date DATE NULL;

-- Add comprehensive constraints
ALTER TABLE farmer_stock 
    ADD CONSTRAINT chk_valid_declaration CHECK (
        declared_qty IS NULL OR declared_qty >= sold_qty
    ),
    ADD CONSTRAINT chk_carry_forward CHECK (
        (carry_forward = true AND carried_from_date IS NOT NULL) OR 
        (carry_forward = false AND carried_from_date IS NULL)
    );

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_farmer_stock_shop_date_status ON farmer_stock(shop_id, entry_date, status);
CREATE INDEX IF NOT EXISTS idx_farmer_stock_farmer_date ON farmer_stock(farmer_user_id, entry_date);
