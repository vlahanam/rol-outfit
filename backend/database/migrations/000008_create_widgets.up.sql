CREATE TABLE widgets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id     UUID REFERENCES widgets(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    type          VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    depth         INTEGER DEFAULT 0,
    status        SMALLINT NOT NULL DEFAULT 1,
    settings      JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  widgets               IS 'Bảng lưu trữ các widget theo cấu trúc cây phân cấp';
COMMENT ON COLUMN widgets.id            IS 'Khóa chính, tự sinh UUID';
COMMENT ON COLUMN widgets.parent_id     IS 'Widget cha, NULL nếu là widget gốc, xóa cascade theo cha';
COMMENT ON COLUMN widgets.name          IS 'Tên hiển thị của widget';
COMMENT ON COLUMN widgets.type          IS 'Loại widget: container, chart, table, v.v.';
COMMENT ON COLUMN widgets.display_order IS 'Thứ tự hiển thị trong cùng một cấp';
COMMENT ON COLUMN widgets.depth         IS 'Cấp độ phân cấp: 0 là gốc, 1 là con cấp 1, v.v.';
COMMENT ON COLUMN widgets.status        IS 'Trạng thái của widget: 1 là ẩn, 2 là hiển thị';
COMMENT ON COLUMN widgets.settings      IS 'Cấu hình linh hoạt của widget, lưu dạng JSONB';
COMMENT ON COLUMN widgets.created_at    IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN widgets.updated_at    IS 'Thời điểm cập nhật gần nhất';

CREATE INDEX idx_widgets_parent_order ON widgets(parent_id, display_order);
