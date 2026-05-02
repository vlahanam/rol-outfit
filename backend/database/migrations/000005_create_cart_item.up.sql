CREATE TABLE IF NOT EXISTS cart_item (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id      UUID           NOT NULL REFERENCES carts (id),
    product_id   UUID           NOT NULL REFERENCES products (id),
    attr_id      UUID,
    price_at_add NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity     INTEGER        NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN cart_item.id           IS 'Định danh duy nhất của mục trong giỏ hàng';
COMMENT ON COLUMN cart_item.cart_id      IS 'Giỏ hàng chứa mục này';
COMMENT ON COLUMN cart_item.product_id   IS 'Sản phẩm được thêm vào giỏ';
COMMENT ON COLUMN cart_item.attr_id      IS 'Thuộc tính sản phẩm được chọn (màu sắc, kích thước, ...)';
COMMENT ON COLUMN cart_item.price_at_add IS 'Giá sản phẩm tại thời điểm thêm vào giỏ';
COMMENT ON COLUMN cart_item.quantity     IS 'Số lượng sản phẩm';
COMMENT ON COLUMN cart_item.created_at   IS 'Thời điểm thêm vào giỏ hàng';
COMMENT ON COLUMN cart_item.updated_at   IS 'Thời điểm cập nhật mục giỏ hàng lần cuối';

CREATE INDEX idx_cart_item_cart_id    ON cart_item (cart_id);
CREATE INDEX idx_cart_item_product_id ON cart_item (product_id);
CREATE INDEX idx_cart_item_attr_id    ON cart_item (attr_id);
