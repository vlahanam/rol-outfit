ALTER TABLE orders ADD COLUMN order_code VARCHAR(16);
CREATE UNIQUE INDEX idx_orders_order_code ON orders(order_code) WHERE order_code IS NOT NULL;
