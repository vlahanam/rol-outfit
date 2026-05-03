CREATE TABLE IF NOT EXISTS products (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID           NOT NULL REFERENCES categories (id),
    name          TEXT           NOT NULL,
    slug          TEXT           NOT NULL,
    default_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description   TEXT,
    avatar        TEXT,
    status        SMALLINT       NOT NULL DEFAULT 1,
    data          JSONB,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

COMMENT ON COLUMN products.id            IS 'Định danh duy nhất của sản phẩm';
COMMENT ON COLUMN products.category_id   IS 'Danh mục chứa sản phẩm';
COMMENT ON COLUMN products.name          IS 'Tên sản phẩm';
COMMENT ON COLUMN products.slug          IS 'Đường dẫn thân thiện URL của sản phẩm';
COMMENT ON COLUMN products.default_price IS 'Giá mặc định của sản phẩm';
COMMENT ON COLUMN products.description   IS 'Mô tả sản phẩm';
COMMENT ON COLUMN products.avatar        IS 'URL ảnh đại diện sản phẩm (NULL nếu chưa có)';
COMMENT ON COLUMN products.status        IS 'Trạng thái sản phẩm (1: hiển thị, 2: ẩn)';
COMMENT ON COLUMN products.data          IS 'Dữ liệu thuộc tính mở rộng dạng JSON';
COMMENT ON COLUMN products.created_at    IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN products.updated_at    IS 'Thời điểm cập nhật bản ghi lần cuối';
COMMENT ON COLUMN products.deleted_at    IS 'Thời điểm xóa mềm (NULL nếu chưa xóa)';

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE UNIQUE INDEX idx_products_slug ON products (slug);
CREATE INDEX idx_products_status      ON products (status);
CREATE INDEX idx_products_deleted     ON products (deleted_at);
CREATE INDEX idx_products_data        ON products USING GIN (data);