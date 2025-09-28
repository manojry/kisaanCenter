-- Migration: Add default_product_id to kisaan_users to speed transaction creation
BEGIN;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='kisaan_users' AND column_name='default_product_id'
    ) THEN
        ALTER TABLE kisaan_users ADD COLUMN default_product_id BIGINT NULL;
        ALTER TABLE kisaan_users ADD CONSTRAINT kisaan_users_default_product_id_fkey FOREIGN KEY (default_product_id)
            REFERENCES kisaan_products(id) ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;
COMMIT;
