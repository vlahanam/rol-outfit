CREATE TYPE widget_type AS ENUM (
    'banner-slider',
    'image-scroll-list',
    'two-large-images',
    'one-large-two-small',
    'slider-and-large-image'
);

ALTER TABLE widgets
    ALTER COLUMN type TYPE widget_type USING type::widget_type;

COMMENT ON COLUMN widgets.type IS 'Loại widget: banner-slider, image-scroll-list, two-large-images, one-large-two-small, slider-and-large-image';
