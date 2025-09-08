-- Migration: Update transactions table schema
-- Date: 2024-12-01
-- Description: Add new fields and update constraints for transaction management

BEGIN;

-- Add new columns if they don't exist
ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'sale';

ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

ALTER TABLE kisaan_transactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing data to match new constraints
UPDATE kisaan_transactions SET status = 'completed' WHERE status = 'paid';
UPDATE kisaan_transactions SET status = 'pending' WHERE status NOT IN ('pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due');

-- Drop existing status constraint if exists
ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE kisaan_transactions DROP CONSTRAINT IF EXISTS kisaan_transactions_status_check;

-- Add new status constraint
ALTER TABLE kisaan_transactions 
ADD CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due'));

-- Add type constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_type') THEN
        ALTER TABLE kisaan_transactions ADD CONSTRAINT check_type CHECK (type IN ('sale', 'purchase', 'credit', 'return'));
    END IF;
END $$;

-- Add payment method constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_payment_method') THEN
        ALTER TABLE kisaan_transactions ADD CONSTRAINT check_payment_method CHECK (payment_method IN ('cash', 'credit', 'bank_transfer', 'upi'));
    END IF;
END $$;

-- Update data types for better precision
ALTER TABLE kisaan_transactions ALTER COLUMN quantity TYPE DECIMAL(10,3);
ALTER TABLE kisaan_transactions ALTER COLUMN total TYPE DECIMAL(12,2);
ALTER TABLE kisaan_transactions ALTER COLUMN commission_amount TYPE DECIMAL(12,2);
ALTER TABLE kisaan_transactions ALTER COLUMN farmer_paid TYPE DECIMAL(12,2);
ALTER TABLE kisaan_transactions ALTER COLUMN buyer_paid TYPE DECIMAL(12,2);
ALTER TABLE kisaan_transactions ALTER COLUMN deficit TYPE DECIMAL(12,2);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON kisaan_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON kisaan_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON kisaan_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON kisaan_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kisaan_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON kisaan_transactions(type);

-- Update timestamps
ALTER TABLE kisaan_transactions ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE kisaan_transactions ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create updated_at trigger
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

COMMIT;