-- Xóa dữ liệu test cũ bị sai
DELETE FROM widgets WHERE name IN ('Bannder slider', 'Bộ sưu tập đặc biệt');

-- Chuyển cột về VARCHAR để có thể drop/recreate enum
ALTER TABLE widgets ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
DROP TYPE widget_type;

-- Tạo lại enum với các giá trị chính xác
CREATE TYPE widget_type AS ENUM (
    'banner-slider',
    'list-image',
    'new-product',
    'trend-hot'
);

-- Cập nhật data seed từ migration 000016 sang type mới
UPDATE widgets SET type = 'list-image'  WHERE name = 'Bộ Sưu Tập Đặc Biệt';
UPDATE widgets SET type = 'new-product' WHERE name = 'Hàng Mới Về';
UPDATE widgets SET type = 'trend-hot'   WHERE name = 'Xu Hướng Hot';

-- Chuyển cột về enum mới
ALTER TABLE widgets ALTER COLUMN type TYPE widget_type USING type::widget_type;

COMMENT ON COLUMN widgets.type IS 'Loại widget: banner-slider, list-image, new-product, trend-hot';
