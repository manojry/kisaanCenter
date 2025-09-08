-- Add balance field to users and update settlement types

-- Add balance to users table
ALTER TABLE kisaan_users ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0.00;

-- Update settlement table to support all payment types
ALTER TABLE kisaan_settlements DROP CONSTRAINT IF EXISTS check_settlement_type;
ALTER TABLE kisaan_settlements ADD CONSTRAINT check_settlement_type 
CHECK (type IN ('payment_made', 'payment_received', 'expense', 'overpayment', 'adjustment'));

-- Create index on balance for performance
CREATE INDEX IF NOT EXISTS idx_users_balance ON kisaan_users(balance);