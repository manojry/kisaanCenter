-- Farmer product assignment mapping (supports multiple products + single default)
BEGIN;
CREATE TABLE IF NOT EXISTS farmer_product_assignments (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES kisaan_users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES kisaan_products(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (farmer_id, product_id)
);

-- Ensure only one default per farmer using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS ux_farmer_default_product
  ON farmer_product_assignments(farmer_id)
  WHERE is_default = TRUE;

COMMIT;
