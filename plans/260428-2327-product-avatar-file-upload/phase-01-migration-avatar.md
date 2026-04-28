---
title: DB Migration — products.avatar
status: done
priority: high
phase: 1
---

# Phase 1: DB Migration — products.avatar

## Overview

Thêm column `avatar TEXT NULL` vào bảng `products` qua migration file (golang-migrate pattern).

## Related Code Files

**Create:**
- `backend/database/migrations/000008_add_products_avatar.up.sql`
- `backend/database/migrations/000008_add_products_avatar.down.sql`

## Implementation Steps

### 000008_add_products_avatar.up.sql

```sql
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS avatar TEXT;

COMMENT ON COLUMN products.avatar IS 'URL ảnh đại diện sản phẩm (NULL nếu chưa có)';
```

### 000008_add_products_avatar.down.sql

```sql
ALTER TABLE products
    DROP COLUMN IF EXISTS avatar;
```

## Todo List

- [x] Tạo `000008_add_products_avatar.up.sql`
- [x] Tạo `000008_add_products_avatar.down.sql`

## Success Criteria

- Migration chạy thành công (`make up` hoặc `RunMigrations`)
- Column `avatar` xuất hiện trong bảng `products` với type `TEXT`, nullable
- Down migration rollback sạch
