CREATE TABLE IF NOT EXISTS categories (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT          NOT NULL,
    slug        TEXT          NOT NULL,
    status      SMALLINT      NOT NULL DEFAULT 1,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON COLUMN categories.id          IS 'Định danh duy nhất của danh mục';
COMMENT ON COLUMN categories.name        IS 'Tên danh mục';
COMMENT ON COLUMN categories.slug        IS 'Đường dẫn thân thiện URL của danh mục';
COMMENT ON COLUMN categories.status      IS 'Trạng thái danh mục (1: hiển thị, 2: ẩn)';
COMMENT ON COLUMN categories.description IS 'Mô tả danh mục';
COMMENT ON COLUMN categories.created_at  IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN categories.updated_at  IS 'Thời điểm cập nhật bản ghi lần cuối';
COMMENT ON COLUMN categories.deleted_at  IS 'Thời điểm xóa mềm (NULL nếu chưa xóa)';

CREATE UNIQUE INDEX idx_categories_slug    ON categories (slug);
CREATE INDEX        idx_categories_status  ON categories (status);
CREATE INDEX        idx_categories_deleted ON categories (deleted_at);