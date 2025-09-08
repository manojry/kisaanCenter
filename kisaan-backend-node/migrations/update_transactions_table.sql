-- Migration to update kisaan_transactions table
-- Run this script to update the existing table structure

-- Add new columns if they don't exist
ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'sale' CHECK (type IN ('sale', 'purchase', 'credit', 'return'));

ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'credit', 'bank_transfer', 'upi'));

ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status enum to include new values
ALTER TABLE kisaan_transactions 
ALTER COLUMN status TYPE VARCHAR(20);

-- Add check constraint for status
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due'));

-- Update data types for better precision
ALTER TABLE kisaan_transactions 
ALTER COLUMN quantity TYPE DECIMAL(10,3);

ALTER TABLE kisaan_transactions 
ALTER COLUMN total TYPE DECIMAL(12,2);

ALTER TABLE kisaan_transactions 
ALTER COLUMN commission_amount TYPE DECIMAL(12,2);

ALTER TABLE kisaan_transactions 
ALTER COLUMN farmer_paid TYPE DECIMAL(12,2);

ALTER TABLE kisaan_transactions 
ALTER COLUMN buyer_paid TYPE DECIMAL(12,2);

ALTER TABLE kisaan_transactions 
ALTER COLUMN deficit TYPE DECIMAL(12,2);

-- Add foreign key constraints if they don't exist
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT IF NOT EXISTS fk_transaction_shop 
FOREIGN KEY (shop_id) REFERENCES kisaan_shops(id) ON DELETE CASCADE;

ALTER TABLE kisaan_transactions 
ADD CONSTRAINT IF NOT EXISTS fk_transaction_farmer 
FOREIGN KEY (farmer_id) REFERENCES kisaan_users(id) ON DELETE CASCADE;

ALTER TABLE kisaan_transactions 
ADD CONSTRAINT IF NOT EXISTS fk_transaction_buyer 
FOREIGN KEY (buyer_id) REFERENCES kisaan_users(id) ON DELETE CASCADE;

ALTER TABLE kisaan_transactions 
ADD CONSTRAINT IF NOT EXISTS fk_transaction_product 
FOREIGN KEY (product_id) REFERENCES kisaan_products(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON kisaan_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON kisaan_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON kisaan_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON kisaan_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kisaan_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON kisaan_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON kisaan_transactions(created_at);

-- Enable timestamps if not already enabled
ALTER TABLE kisaan_transactions 
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE kisaan_transactions 
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transactions_updated_at ON kisaan_transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON kisaan_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have default type if null
UPDATE kisaan_transactions SET type = 'sale' WHERE type IS NULL;

COMMIT;