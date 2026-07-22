ALTER TABLE products
DROP COLUMN IF EXISTS size_guide,
DROP COLUMN IF EXISTS size_guide_ja,
DROP COLUMN IF EXISTS delivery_info,
DROP COLUMN IF EXISTS delivery_info_ja;
