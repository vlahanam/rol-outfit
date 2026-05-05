CREATE TABLE IF NOT EXISTS carts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN carts.id         IS 'Định danh duy nhất của giỏ hàng';
COMMENT ON COLUMN carts.user_id    IS 'Người dùng sở hữu giỏ hàng';
COMMENT ON COLUMN carts.created_at IS 'Thời điểm tạo giỏ hàng';

CREATE INDEX idx_carts_user_id ON carts (user_id);
