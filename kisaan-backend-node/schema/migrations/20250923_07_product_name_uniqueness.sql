-- Migration: Enforce case-insensitive uniqueness of product names per shop
-- Strategy A (auto-fix):
-- 1. Normalize names to trimmed lowercase
-- 2. Detect duplicates (same shop_id + lower(name)) and rename later occurrences with numeric suffix
-- 3. Add a functional unique index

BEGIN;

-- 1. Normalize existing names (lowercase + trim)
UPDATE kisaan_products
SET name = LOWER(TRIM(name))
WHERE name <> LOWER(TRIM(name));

-- 2. Resolve duplicates by appending suffixes
WITH ranked AS (
  SELECT id, shop_id, name,
         ROW_NUMBER() OVER (PARTITION BY shop_id, name ORDER BY id) AS rn
  FROM kisaan_products
)
UPDATE kisaan_products p
SET name = CONCAT(p.name, ' (dup', r.rn - 1, ')')
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1; -- only adjust duplicates beyond first

-- 3. Create unique index (case-insensitive uniqueness per shop)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_products_shop_name_ci'
  ) THEN
    CREATE UNIQUE INDEX ux_products_shop_name_ci ON kisaan_products (shop_id, LOWER(name));
  END IF;
END$$;

COMMIT;

-- Down (manual): DROP INDEX IF EXISTS ux_products_shop_name_ci; (names with suffixes remain)
