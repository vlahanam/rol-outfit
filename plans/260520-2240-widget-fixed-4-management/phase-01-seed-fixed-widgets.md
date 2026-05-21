---
phase: 1
title: Backend – Seed 4 Widget Cố Định
status: completed
completed: 2026-05-20
---

# Phase 1 – Seed 4 Widget Cố Định

## Overview

Tạo migration seed để insert 4 widget cố định vào DB. Migration `up` insert, `down` delete.

## Files

- **NEW** `backend/database/migrations/000016_seed_fixed_widgets.up.sql`
- **NEW** `backend/database/migrations/000016_seed_fixed_widgets.down.sql`

## Implementation

### up.sql

```sql
INSERT INTO widgets (id, parent_id, name, type, display_order, depth, status, settings, metadata)
VALUES
  (gen_random_uuid(), NULL, 'Banner Slider',          'banner-slider',    1, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Bộ Sưu Tập Đặc Biệt',  'image-scroll-list', 2, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Hàng Mới Về',            'image-scroll-list', 3, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Xu Hướng Hot',           'image-scroll-list', 4, 0, 2, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT DO NOTHING;
```

### down.sql

```sql
DELETE FROM widgets
WHERE parent_id IS NULL
  AND name IN ('Banner Slider', 'Bộ Sưu Tập Đặc Biệt', 'Hàng Mới Về', 'Xu Hướng Hot')
  AND display_order IN (1, 2, 3, 4);
```

## Notes

- Migration chạy một lần khi `make up` hoặc `migrate up`
- Nếu DB đã có dữ liệu widget cũ → `ON CONFLICT DO NOTHING` bảo vệ
- `down.sql` xóa theo name + display_order để tránh xóa nhầm widget khác

## Todo

- [x] Tạo `000016_seed_fixed_widgets.up.sql`
- [x] Tạo `000016_seed_fixed_widgets.down.sql`
- [x] Chạy migration kiểm tra kết quả
