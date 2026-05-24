---
title: Collection Grid Widget Preview
status: completed
priority: high
created: 2026-05-24
completed: 2026-05-24
planDir: plans/260524-0852-collection-grid-widget
blockedBy: []
blocks: []
---

# Collection Grid Widget Preview

Rename `list-image` → `collection-grid` widget type và implement preview/editor components trong admin.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend Type Rename](phase-01-backend-rename.md) | ✅ done | 20 min |
| 2 | [Frontend Types & Labels](phase-02-frontend-types.md) | ✅ done | 10 min |
| 3 | [Preview Component](phase-03-preview-component.md) | ✅ done | 30 min |
| 4 | [Editor Component](phase-04-editor-component.md) | ✅ done | 30 min |
| 5 | [Edit Page Integration](phase-05-integration.md) | ✅ done | 15 min |
| 6 | [Storefront Dynamic Data](phase-06-storefront.md) | ✅ done | 25 min |

**Total:** ~2 hours

## Context

- **Brainstorm:** `plans/reports/brainstorm-260524-0852-collection-grid-widget-preview.md`
- **Widget ID:** `ba9b6e9d-a7e5-4b6b-9a3b-42f3f1ae5a4d`
- **Pattern Reference:** BannerSliderPreview component

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Type approach | Rename `list-image` | Cleaner than adding new type, existing data preserved |
| Preview style | Grid 4 cols + scroll | Match storefront layout |
| Device toggle | Desktop/Mobile | Consistent with banner-slider |
| Metadata | `{items: [{id,title,image,link,cta_text}]}` | Simple, covers all CollectionCard fields |

## Architecture

```
Admin Widget Edit Page
    │
    ├─ CollectionGridPreview
    │   ├─ Device toggle (desktop/mobile)
    │   ├─ Grid display (4 cols desktop, 2 mobile)
    │   ├─ Scroll navigation (< > buttons)
    │   └─ Click item → select in editor
    │
    └─ CollectionGridEditor
        ├─ Item tabs (Item 1, Item 2, ...)
        ├─ Add item button
        ├─ Image uploader
        ├─ Text fields (title, link, cta_text)
        └─ Remove item button
```

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `backend/src/internal/models/widget.go` | Modify | 1 |
| `backend/src/internal/seeder/seed_widgets.go` | Modify | 1 |
| `frontend/types/api.ts` | Modify | 2 |
| `frontend/lib/api.ts` | Modify | 2 |
| `frontend/components/admin/widgets/collection-grid-preview.tsx` | Create | 3 |
| `frontend/components/admin/widgets/collection-grid-editor.tsx` | Create | 4 |
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | Modify | 5 |
| `frontend/app/[locale]/(main)/page.tsx` | Modify | 6 |
| `frontend/components/storefront/collection-grid.tsx` | Create | 6 |

## Success Criteria

- [x] Backend accepts `collection-grid` widget type
- [x] Existing widget data preserved after rename
- [x] Preview shows grid with navigation
- [x] Editor allows CRUD on items
- [x] Desktop/Mobile toggle works
- [x] Storefront renders from widget data (no hardcode)

## Risks

| Risk | Mitigation |
|------|------------|
| DB enum type constraint | Use migration or raw SQL update |
| Existing widget data loss | Backup before migration |
| Frontend type mismatch | Update all references before testing |
