CREATE TABLE IF NOT EXISTS orders (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL REFERENCES users (id),
    shipping_address TEXT           NOT NULL,
    phone            TEXT           NOT NULL,
    total_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status           SMALLINT       NOT NULL DEFAULT 1,
    note             TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

COMMENT ON COLUMN orders.id               IS 'Định danh duy nhất của đơn hàng';
COMMENT ON COLUMN orders.user_id          IS 'Người dùng đặt đơn hàng';
COMMENT ON COLUMN orders.shipping_address IS 'Địa chỉ giao hàng tại thời điểm đặt (snapshot)';
COMMENT ON COLUMN orders.phone            IS 'Số điện thoại liên hệ tại thời điểm đặt (snapshot)';
COMMENT ON COLUMN orders.total_price      IS 'Tổng giá trị đơn hàng';
COMMENT ON COLUMN orders.status           IS 'Trạng thái đơn hàng (1: chờ xác nhận, 2: đã xác nhận, 3: đang giao, 4: đã giao, 5: đã thanh toán, 6: đã hủy)';
COMMENT ON COLUMN orders.note             IS 'Ghi chú của khách hàng';
COMMENT ON COLUMN orders.created_at       IS 'Thời điểm tạo đơn hàng';
COMMENT ON COLUMN orders.updated_at       IS 'Thời điểm cập nhật đơn hàng lần cuối';
COMMENT ON COLUMN orders.deleted_at       IS 'Thời điểm xóa mềm (NULL nếu chưa xóa)';

CREATE        INDEX idx_orders_user_id    ON orders (user_id);
CREATE        INDEX idx_orders_status     ON orders (status);
CREATE        INDEX idx_orders_created_at ON orders (created_at);
CREATE        INDEX idx_orders_deleted    ON orders (deleted_at);
