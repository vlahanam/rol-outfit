ALTER TABLE user_addresses
DROP COLUMN IF EXISTS postal_code;

ALTER TABLE orders
DROP COLUMN IF EXISTS postal_code;
