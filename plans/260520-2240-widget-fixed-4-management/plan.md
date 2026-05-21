---
title: Widget Management – 4 Fixed Widgets (No Add/Delete)
status: completed
priority: high
created: 2026-05-20
completed: 2026-05-20
planDir: plans/260520-2240-widget-fixed-4-management
blockedBy: []
blocks: []
---

# Widget Management – 4 Fixed Widgets

Chuyển widget management từ CRUD đầy đủ sang hệ thống 4 widget cố định chỉ có edit.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend – Seed 4 widget cố định](phase-01-seed-fixed-widgets.md) | completed | 20 min |
| 2 | [Frontend – Đơn giản hóa widget admin](phase-02-simplify-widget-admin.md) | completed | 40 min |

## 4 Widget Cố Định (theo thứ tự)

| Order | Name | Type |
|-------|------|------|
| 1 | Banner Slider | `banner-slider` |
| 2 | Bộ Sưu Tập Đặc Biệt | `image-scroll-list` |
| 3 | Hàng Mới Về | `image-scroll-list` |
| 4 | Xu Hướng Hot | `image-scroll-list` |

## Scope

**Backend:**
- `backend/database/migrations/000016_seed_fixed_widgets.{up,down}.sql` (NEW)

**Frontend:**
- `frontend/app/admin/(protected)/widgets/page.tsx` — remove add/delete/DnD
- `frontend/app/admin/(protected)/widgets/add/page.tsx` — DELETE file
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` — type read-only
- `frontend/components/admin/widgets/widget-sortable-row.tsx` — remove DnD/delete → rename to widget-row.tsx
- `frontend/components/admin/widgets/widget-constants.ts` — DELETE (unused)
- `frontend/lib/api.ts` — update WIDGET_TYPE_LABEL
