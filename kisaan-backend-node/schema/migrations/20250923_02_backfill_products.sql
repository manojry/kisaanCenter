-- Backfill products and link existing transactions
-- Creates distinct products per (LOWER(product_name), shop_id) and updates transactions.product_id
BEGIN;

WITH distinct_products AS (
    SELECT DISTINCT LOWER(TRIM(product_name)) AS norm_name, shop_id
    FROM kisaan_transactions
    WHERE product_name IS NOT NULL AND product_name <> ''
), inserted AS (
    INSERT INTO kisaan_products (name, shop_id)
    SELECT norm_name, shop_id FROM distinct_products dp
    ON CONFLICT DO NOTHING
    RETURNING id, name, shop_id
)
UPDATE kisaan_transactions t
SET product_id = p.id
FROM kisaan_products p
WHERE t.product_id IS NULL
  AND LOWER(TRIM(t.product_name)) = p.name
  AND (t.shop_id = p.shop_id OR p.shop_id IS NULL);

COMMIT;
