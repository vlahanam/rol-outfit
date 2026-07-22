ALTER TABLE user_addresses
ADD COLUMN postal_code VARCHAR(20);

ALTER TABLE orders
ADD COLUMN postal_code VARCHAR(20);
