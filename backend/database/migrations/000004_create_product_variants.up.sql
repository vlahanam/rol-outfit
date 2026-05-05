CREATE TABLE IF NOT EXISTS product_variants (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID           NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    attributes       JSONB          NOT NULL DEFAULT '{}',
    price            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock            INTEGER        NOT NULL DEFAULT 0,
    sold             INTEGER        NOT NULL DEFAULT 0,
    avatar           TEXT,
    status           SMALLINT       NOT NULL DEFAULT 1,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN product_variants.id         IS 'Định danh duy nhất của biến thể sản phẩm';
COMMENT ON COLUMN product_variants.product_id IS 'Sản phẩm cha của biến thể';
COMMENT ON COLUMN product_variants.attributes IS 'Giá trị thuộc tính cụ thể của biến thể (ví dụ: {"Size": "39", "Color": "Black"})';
COMMENT ON COLUMN product_variants.price      IS 'Giá bán của biến thể';
COMMENT ON COLUMN product_variants.stock      IS 'Số lượng tồn kho';
COMMENT ON COLUMN product_variants.sold       IS 'Số lượng đã bán';
COMMENT ON COLUMN product_variants.avatar     IS 'URL ảnh đại diện của biến thể (NULL nếu chưa có)';
COMMENT ON COLUMN product_variants.status     IS 'Trạng thái biến thể (1: hiển thị, 2: ẩn)';
COMMENT ON COLUMN product_variants.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN product_variants.updated_at IS 'Thời điểm cập nhật bản ghi lần cuối';

CREATE INDEX idx_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_variants_attributes ON product_variants USING GIN (attributes);
