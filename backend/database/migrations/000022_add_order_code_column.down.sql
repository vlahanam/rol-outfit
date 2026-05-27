DROP INDEX IF EXISTS idx_orders_order_code;
ALTER TABLE orders DROP COLUMN IF EXISTS order_code;
