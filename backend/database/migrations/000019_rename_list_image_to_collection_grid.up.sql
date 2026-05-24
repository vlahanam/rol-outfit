-- Rename widget type enum value: list-image → collection-grid
ALTER TYPE widget_type RENAME VALUE 'list-image' TO 'collection-grid';

COMMENT ON COLUMN widgets.type IS 'Loại widget: banner-slider, collection-grid, new-product, trend-hot';
