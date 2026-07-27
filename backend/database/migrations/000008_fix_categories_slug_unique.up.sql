-- Fix unique constraint on slug to exclude soft-deleted categories
-- This allows reusing slugs from deleted categories

DROP INDEX IF EXISTS idx_categories_slug;
CREATE UNIQUE INDEX idx_categories_slug ON categories (slug) WHERE deleted_at IS NULL;
