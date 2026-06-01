-- Remove Japanese i18n columns

ALTER TABLE products DROP COLUMN IF EXISTS name_ja;
ALTER TABLE products DROP COLUMN IF EXISTS description_ja;
ALTER TABLE product_variants DROP COLUMN IF EXISTS name;
ALTER TABLE product_variants DROP COLUMN IF EXISTS name_ja;
ALTER TABLE categories DROP COLUMN IF EXISTS name_ja;
ALTER TABLE categories DROP COLUMN IF EXISTS description_ja;
ALTER TABLE tags DROP COLUMN IF EXISTS name_ja;
ALTER TABLE widgets DROP COLUMN IF EXISTS name_ja;
