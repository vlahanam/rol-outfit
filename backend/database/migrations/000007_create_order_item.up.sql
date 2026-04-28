CREATE TABLE IF NOT EXISTS order_item (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID           NOT NULL REFERENCES orders (id),
    product_id UUID           NOT NULL REFERENCES products (id),
    attr_id    UUID,
    price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity   INTEGER        NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN order_item.id         IS 'Định danh duy nhất của mục trong đơn hàng';
COMMENT ON COLUMN order_item.order_id   IS 'Đơn hàng chứa mục này';
COMMENT ON COLUMN order_item.product_id IS 'Sản phẩm được đặt mua';
COMMENT ON COLUMN order_item.attr_id    IS 'Thuộc tính sản phẩm được chọn (màu sắc, kích thước, ...)';
COMMENT ON COLUMN order_item.price      IS 'Giá sản phẩm tại thời điểm đặt hàng (snapshot)';
COMMENT ON COLUMN order_item.quantity   IS 'Số lượng sản phẩm';
COMMENT ON COLUMN order_item.created_at IS 'Thời điểm tạo mục đơn hàng';
COMMENT ON COLUMN order_item.updated_at IS 'Thời điểm cập nhật mục đơn hàng lần cuối';

CREATE INDEX idx_order_item_order_id   ON order_item (order_id);
CREATE INDEX idx_order_item_product_id ON order_item (product_id);
CREATE INDEX idx_order_item_attr_id    ON order_item (attr_id);
