-- Create settlements table and add user balance

-- Create settlements table
CREATE TABLE IF NOT EXISTS kisaan_settlements (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('farmer', 'buyer')),
    transaction_id INTEGER,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('payment_made', 'payment_received', 'expense', 'overpayment', 'adjustment')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add balance to users table
ALTER TABLE kisaan_users ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0.00;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settlements_shop_id ON kisaan_settlements(shop_id);
CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON kisaan_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_type ON kisaan_settlements(type);
CREATE INDEX IF NOT EXISTS idx_users_balance ON kisaan_users(balance);