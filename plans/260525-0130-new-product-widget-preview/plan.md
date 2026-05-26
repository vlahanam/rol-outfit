---
title: New Product Widget Preview
status: complete
priority: high
created: 2026-05-25
completed: 2026-05-25
planDir: plans/260525-0130-new-product-widget-preview
blockedBy: []
blocks: []
---

# New Product Widget Preview

Implement editor and preview for `new-product` widget type, allowing admin to configure which products appear in "Hàng Mới Về" section via tag selection.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend Multi-Tag API](phase-01-backend-multi-tag-api.md) | complete | 1h |
| 2 | [Frontend Editor & Preview](phase-02-frontend-editor-preview.md) | complete | 3h |
| 3 | [Homepage Integration](phase-03-homepage-integration.md) | complete | 1h |

## Context

- **Brainstorm Report:** `plans/reports/brainstorm-260525-new-product-widget-preview.md`
- **Pattern Reference:** `trend-hot` widget (has inline preview + settings)

## Key Decisions

| Decision | Choice |
|----------|--------|
| Data source | Fetch real products by tags |
| Tag logic | OR (product has ANY selected tag) |
| Preview type | Inline only (no modal) |
| Widget title | Use widget.name |
| Settings | tag_ids, quantity (5-20), columns (2-5) |

## Dependencies

- Backend: `product_repo.go`, `product_controller.go`
- Frontend: `widget edit page`, `api-resources.ts`, `types/api.ts`
- Pattern: Follow `trend-hot-editor.tsx`, `trend-hot-preview.tsx`

## Success Criteria

- [x] API supports `?tags=slug1,slug2` with OR logic
- [x] Widget edit shows editor when type = `new-product`
- [x] Tag multi-select fetches/displays available tags
- [x] Preview fetches real products by selected tags
- [x] Preview respects quantity and columns settings
- [x] Save persists configuration to widget metadata/settings
