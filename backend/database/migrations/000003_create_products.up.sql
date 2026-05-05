CREATE TABLE IF NOT EXISTS products (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID           NOT NULL REFERENCES categories (id),
    name            TEXT           NOT NULL,
    slug            TEXT           NOT NULL,
    default_price   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description     TEXT,
    avatar          TEXT,
    status          SMALLINT       NOT NULL DEFAULT 1,
    attribute_names TEXT[]         NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE  products                 IS 'Bảng lưu trữ thông tin sản phẩm chính';
COMMENT ON COLUMN products.id              IS 'Định danh duy nhất của sản phẩm';
COMMENT ON COLUMN products.category_id     IS 'Liên kết tới danh mục sản phẩm';
COMMENT ON COLUMN products.name            IS 'Tên gọi chi tiết của sản phẩm';
COMMENT ON COLUMN products.slug            IS 'Đường dẫn URL thân thiện (duy nhất)';
COMMENT ON COLUMN products.default_price   IS 'Giá bán hiển thị mặc định';
COMMENT ON COLUMN products.description     IS 'Nội dung mô tả chi tiết sản phẩm';
COMMENT ON COLUMN products.avatar          IS 'Đường dẫn hình ảnh đại diện';
COMMENT ON COLUMN products.status          IS 'Trạng thái kinh doanh (1: Hoạt động, 2: Tạm ẩn)';
COMMENT ON COLUMN products.attribute_names IS 'Danh sách các loại thuộc tính biến thể (Ví dụ: {Size, Color})';
COMMENT ON COLUMN products.created_at      IS 'Thời điểm khởi tạo bản ghi';
COMMENT ON COLUMN products.updated_at      IS 'Thời điểm cập nhật bản ghi gần nhất';
COMMENT ON COLUMN products.deleted_at      IS 'Thời điểm xóa bản ghi (Xóa mềm)';

CREATE INDEX idx_products_category_id   ON products (category_id);
CREATE UNIQUE INDEX idx_products_slug   ON products (slug);
CREATE INDEX idx_products_status        ON products (status);
CREATE INDEX idx_products_deleted       ON products (deleted_at);
CREATE INDEX idx_products_attr_names    ON products USING GIN (attribute_names);