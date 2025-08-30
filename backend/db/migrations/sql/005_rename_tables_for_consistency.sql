-- Rename shop to shops
ALTER TABLE shop RENAME TO shops;

-- Rename farmer_stock to farmer_stocks
ALTER TABLE farmer_stock RENAME TO farmer_stocks;

-- Update foreign key references in transactions table
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_shop_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id);

-- Update foreign key references in farmer_payment table
ALTER TABLE farmer_payment DROP CONSTRAINT IF EXISTS farmer_payment_farmer_stock_id_fkey;
ALTER TABLE farmer_payment ADD CONSTRAINT farmer_payment_farmer_stock_id_fkey FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stocks(id);

-- Update foreign key references in transaction_items table
ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS transaction_items_farmer_stock_id_fkey;
ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_farmer_stock_id_fkey FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stocks(id);

-- Update foreign key references in farmer_stock_audit table
ALTER TABLE farmer_stock_audit DROP CONSTRAINT IF EXISTS farmer_stock_audit_farmer_stock_id_fkey;
ALTER TABLE farmer_stock_audit ADD CONSTRAINT farmer_stock_audit_farmer_stock_id_fkey FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stocks(id);

-- Update foreign key references in users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_shop_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id);
