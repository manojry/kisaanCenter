-- FINAL MIGRATION - Run this one only
-- Adds constraints and indexes for transaction management

-- Add type constraint (skip if exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_type') THEN
        ALTER TABLE kisaan_transactions ADD CONSTRAINT check_type CHECK (type IN ('sale', 'purchase', 'credit', 'return'));
    END IF;
END $$;

-- Add payment method constraint (skip if exists)  
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_method') THEN
        ALTER TABLE kisaan_transactions ADD CONSTRAINT check_payment_method CHECK (payment_method IN ('cash', 'credit', 'bank_transfer', 'upi'));
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type ON kisaan_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON kisaan_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kisaan_transactions(transaction_date);