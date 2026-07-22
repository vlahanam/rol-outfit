-- Revert: make order_id NOT NULL again
UPDATE product_reviews SET order_id = '00000000-0000-0000-0000-000000000000' WHERE order_id IS NULL;
ALTER TABLE product_reviews ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN order_id SET DEFAULT gen_random_uuid();
