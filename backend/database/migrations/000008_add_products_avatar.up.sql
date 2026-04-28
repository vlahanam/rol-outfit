ALTER TABLE products
    ADD COLUMN IF NOT EXISTS avatar TEXT;

COMMENT ON COLUMN products.avatar IS 'URL ảnh đại diện sản phẩm (NULL nếu chưa có)';
