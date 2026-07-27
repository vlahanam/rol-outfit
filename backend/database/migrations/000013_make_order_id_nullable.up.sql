-- Make order_id nullable in product_reviews to allow any user to comment
ALTER TABLE product_reviews ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN order_id DROP DEFAULT;
