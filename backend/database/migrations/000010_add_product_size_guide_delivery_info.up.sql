-- Add size_guide and delivery_info JSONB columns to products table
-- These allow per-product customization of size guide and delivery time info

ALTER TABLE products
ADD COLUMN IF NOT EXISTS size_guide JSONB,
ADD COLUMN IF NOT EXISTS size_guide_ja JSONB,
ADD COLUMN IF NOT EXISTS delivery_info JSONB,
ADD COLUMN IF NOT EXISTS delivery_info_ja JSONB;

COMMENT ON COLUMN products.size_guide IS 'Custom size guide data (Vietnamese). Format: [{size, height, weight}, ...]';
COMMENT ON COLUMN products.size_guide_ja IS 'Custom size guide data (Japanese)';
COMMENT ON COLUMN products.delivery_info IS 'Custom delivery time info (Vietnamese). Format: [{region, time}, ...]';
COMMENT ON COLUMN products.delivery_info_ja IS 'Custom delivery time info (Japanese)';
