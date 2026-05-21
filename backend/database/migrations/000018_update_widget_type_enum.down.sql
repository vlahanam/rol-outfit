ALTER TABLE widgets ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
DROP TYPE widget_type;

CREATE TYPE widget_type AS ENUM (
    'banner-slider',
    'image-scroll-list',
    'two-large-images',
    'one-large-two-small',
    'slider-and-large-image'
);

UPDATE widgets SET type = 'image-scroll-list' WHERE name IN ('Bộ Sưu Tập Đặc Biệt', 'Hàng Mới Về', 'Xu Hướng Hot');

ALTER TABLE widgets ALTER COLUMN type TYPE widget_type USING type::widget_type;
