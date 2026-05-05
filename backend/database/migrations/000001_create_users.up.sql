CREATE TABLE IF NOT EXISTS users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name  TEXT        NOT NULL,
    email      TEXT        NOT NULL,
    password   TEXT        NOT NULL,
    address    TEXT        NOT NULL,
    phone      TEXT        NOT NULL CHECK (
        length(phone) >= 10
        AND length(phone) <= 15
    ),
    role       SMALLINT    NOT NULL DEFAULT 2,
    status     SMALLINT    NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON COLUMN users.id         IS 'Định danh duy nhất của người dùng';
COMMENT ON COLUMN users.full_name  IS 'Họ và tên';
COMMENT ON COLUMN users.email      IS 'Địa chỉ email';
COMMENT ON COLUMN users.password   IS 'Mật khẩu đã được mã hóa';
COMMENT ON COLUMN users.address    IS 'Địa chỉ giao hàng';
COMMENT ON COLUMN users.phone      IS 'Số điện thoại';
COMMENT ON COLUMN users.role       IS 'Vai trò (1: admin, 2: customer)';
COMMENT ON COLUMN users.status     IS 'Trạng thái tài khoản (1: hoạt động, 2: bị khóa)';
COMMENT ON COLUMN users.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN users.updated_at IS 'Thời điểm cập nhật lần cuối';
COMMENT ON COLUMN users.deleted_at IS 'Thời điểm xóa mềm (NULL nếu chưa xóa)';

CREATE UNIQUE INDEX idx_users_email   ON users (email);
CREATE UNIQUE INDEX idx_users_phone   ON users (phone);
CREATE INDEX        idx_users_status  ON users (status);
CREATE INDEX        idx_users_role    ON users (role);
CREATE INDEX        idx_users_deleted ON users (deleted_at);