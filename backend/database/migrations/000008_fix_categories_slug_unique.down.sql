-- Revert to original non-partial unique index
DROP INDEX IF EXISTS idx_categories_slug;
CREATE UNIQUE INDEX idx_categories_slug ON categories (slug);
