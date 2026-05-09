ALTER TABLE product_variants
  DROP COLUMN IF EXISTS discount_percent,
  DROP COLUMN IF EXISTS discount_start_at,
  DROP COLUMN IF EXISTS discount_end_at;
