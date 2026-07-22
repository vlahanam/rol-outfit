-- Add currency_type to orders (1=Japanese/Yen, 2=Vietnamese/VND)
ALTER TABLE orders ADD COLUMN currency_type SMALLINT NOT NULL DEFAULT 2;
COMMENT ON COLUMN orders.currency_type IS '1: Japanese (Yen), 2: Vietnamese (VND)';
