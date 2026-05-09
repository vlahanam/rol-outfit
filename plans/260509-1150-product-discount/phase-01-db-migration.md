# Phase 01 — Backend DB Migration

**Status:** done | **Effort:** 30m

## Files to Create

| File | Description |
|------|-------------|
| `backend/database/migrations/000013_add_discount_to_products.up.sql` | Add discount columns to products |
| `backend/database/migrations/000013_add_discount_to_products.down.sql` | Rollback |
| `backend/database/migrations/000014_add_discount_to_variants.up.sql` | Add discount columns to product_variants |
| `backend/database/migrations/000014_add_discount_to_variants.down.sql` | Rollback |

## SQL — 000013 up

```sql
ALTER TABLE products
  ADD COLUMN discount_percent  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN discount_start_at TIMESTAMPTZ   NULL,
  ADD COLUMN discount_end_at   TIMESTAMPTZ   NULL;

COMMENT ON COLUMN products.discount_percent  IS 'Phần trăm giảm giá (0–100). 0 = không giảm';
COMMENT ON COLUMN products.discount_start_at IS 'Thời điểm bắt đầu giảm giá (NULL = không giới hạn)';
COMMENT ON COLUMN products.discount_end_at   IS 'Thời điểm kết thúc giảm giá (NULL = không giới hạn)';

CREATE INDEX idx_products_discount ON products (discount_percent) WHERE discount_percent > 0;
```

## SQL — 000013 down

```sql
ALTER TABLE products
  DROP COLUMN IF EXISTS discount_percent,
  DROP COLUMN IF EXISTS discount_start_at,
  DROP COLUMN IF EXISTS discount_end_at;
```

## SQL — 000014 up

```sql
ALTER TABLE product_variants
  ADD COLUMN discount_percent  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN discount_start_at TIMESTAMPTZ   NULL,
  ADD COLUMN discount_end_at   TIMESTAMPTZ   NULL;

COMMENT ON COLUMN product_variants.discount_percent  IS 'Phần trăm giảm giá riêng của biến thể (0 = dùng discount của sản phẩm)';
COMMENT ON COLUMN product_variants.discount_start_at IS 'Thời điểm bắt đầu hiệu lực';
COMMENT ON COLUMN product_variants.discount_end_at   IS 'Thời điểm kết thúc hiệu lực';
```

## SQL — 000014 down

```sql
ALTER TABLE product_variants
  DROP COLUMN IF EXISTS discount_percent,
  DROP COLUMN IF EXISTS discount_start_at,
  DROP COLUMN IF EXISTS discount_end_at;
```

## How to Apply

Migrations run automatically on backend startup via `migrate` in `initialize/loadconfig.go`. Verify by running:
```bash
make db-shell
# then: \d products  →  should show discount_percent column
```

## Todo

- [x] Create 000013 up/down SQL files
- [x] Create 000014 up/down SQL files
- [x] Restart backend and verify columns exist in DB
