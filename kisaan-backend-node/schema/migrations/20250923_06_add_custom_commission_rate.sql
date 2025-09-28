-- Migration: Add custom commission rate per farmer
-- Adds a nullable custom_commission_rate to kisaan_users with bounds check

ALTER TABLE kisaan_users
  ADD COLUMN IF NOT EXISTS custom_commission_rate NUMERIC(5,2)
  CHECK (custom_commission_rate IS NULL OR (custom_commission_rate >= 0 AND custom_commission_rate <= 100));

-- No backfill required; null means "use shop default".
-- Down migration (manual): ALTER TABLE kisaan_users DROP COLUMN custom_commission_rate;
