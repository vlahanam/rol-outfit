-- Add Japanese i18n columns to support multilingual content (Vietnamese + Japanese)

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ja TEXT;

-- Product Variants (NEW name field + ja version)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_ja TEXT;

-- Tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Widgets
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Comments
COMMENT ON COLUMN products.name_ja IS 'Japanese translation of product name';
COMMENT ON COLUMN products.description_ja IS 'Japanese translation of product description';
COMMENT ON COLUMN product_variants.name IS 'Display name for variant (optional)';
COMMENT ON COLUMN product_variants.name_ja IS 'Japanese translation of variant name';
COMMENT ON COLUMN categories.name_ja IS 'Japanese translation of category name';
COMMENT ON COLUMN categories.description_ja IS 'Japanese translation of category description';
COMMENT ON COLUMN tags.name_ja IS 'Japanese translation of tag name';
COMMENT ON COLUMN widgets.name_ja IS 'Japanese translation of widget name';
