ALTER TABLE products
  ADD COLUMN discount_percent  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN discount_start_at TIMESTAMPTZ   NULL,
  ADD COLUMN discount_end_at   TIMESTAMPTZ   NULL;

COMMENT ON COLUMN products.discount_percent  IS 'Phần trăm giảm giá (0–100). 0 = không giảm';
COMMENT ON COLUMN products.discount_start_at IS 'Thời điểm bắt đầu giảm giá (NULL = không giới hạn)';
COMMENT ON COLUMN products.discount_end_at   IS 'Thời điểm kết thúc giảm giá (NULL = không giới hạn)';

CREATE INDEX idx_products_discount ON products (discount_percent) WHERE discount_percent > 0;
