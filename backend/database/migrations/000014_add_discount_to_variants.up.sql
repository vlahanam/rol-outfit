ALTER TABLE product_variants
  ADD COLUMN discount_percent  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN discount_start_at TIMESTAMPTZ   NULL,
  ADD COLUMN discount_end_at   TIMESTAMPTZ   NULL;

COMMENT ON COLUMN product_variants.discount_percent  IS 'Phần trăm giảm giá riêng của biến thể (0 = dùng discount của sản phẩm)';
COMMENT ON COLUMN product_variants.discount_start_at IS 'Thời điểm bắt đầu hiệu lực';
COMMENT ON COLUMN product_variants.discount_end_at   IS 'Thời điểm kết thúc hiệu lực';
