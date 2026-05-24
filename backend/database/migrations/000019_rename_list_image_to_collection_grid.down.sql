-- Rollback: collection-grid → list-image
ALTER TYPE widget_type RENAME VALUE 'collection-grid' TO 'list-image';

COMMENT ON COLUMN widgets.type IS 'Loại widget: banner-slider, list-image, new-product, trend-hot';
