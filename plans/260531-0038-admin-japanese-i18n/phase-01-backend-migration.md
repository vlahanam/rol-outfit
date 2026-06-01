# Phase 1: Backend Migration

**Status:** todo | **Effort:** 30m | **Priority:** P0

## Overview

Add _ja columns to 5 tables via SQL migration.

## Migration SQL

Create `backend/database/migrations/000012_add_i18n_columns.sql`:

```sql
-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ja TEXT;

-- Product Variants (NEW name field + ja version)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_ja TEXT;

-- Tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Widgets
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255);

-- Comments
COMMENT ON COLUMN products.name_ja IS 'Japanese translation of product name';
COMMENT ON COLUMN products.description_ja IS 'Japanese translation of product description';
COMMENT ON COLUMN product_variants.name IS 'Display name for variant (optional)';
COMMENT ON COLUMN product_variants.name_ja IS 'Japanese translation of variant name';
COMMENT ON COLUMN categories.name_ja IS 'Japanese translation of category name';
COMMENT ON COLUMN categories.description_ja IS 'Japanese translation of category description';
COMMENT ON COLUMN tags.name_ja IS 'Japanese translation of tag name';
COMMENT ON COLUMN widgets.name_ja IS 'Japanese translation of widget name';
```

## Steps

1. Check existing migration files to determine next number
2. Create migration file
3. Run `make db-shell` and execute migration
4. Verify columns added with `\d products`, `\d categories`, etc.

## Validation

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name LIKE '%_ja';
```

## Todo

- [ ] Create migration file
- [ ] Execute migration
- [ ] Verify all 5 tables have _ja columns
