---
name: Trend Hot Widget Preview
status: completed
created: 2026-05-24
completed: 2026-05-25
priority: medium
effort: 4h
blockedBy: []
blocks: []
---

# Trend Hot Widget Preview

Preview feature cho widget "Xu hướng hot" trong admin edit page, giống với hiển thị trên homepage.

## Context

- Brainstorm: `plans/reports/brainstorm-260524-2338-trend-hot-widget-preview.md`
- Widget type `trend-hot` đã có trong types, chưa có editor/preview
- Reuse `CollectionItem` type (DRY)
- Full-page preview via iframe + postMessage

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](phase-01-types-setup.md) | Add TrendHotSettings type | completed | 15m |
| [Phase 2](phase-02-trend-hot-preview.md) | Create TrendHotPreview component | completed | 1h |
| [Phase 3](phase-03-trend-hot-editor.md) | Create TrendHotEditor component | completed | 45m |
| [Phase 4](phase-04-full-page-preview-modal.md) | Create FullPagePreviewModal | completed | 45m |
| [Phase 5](phase-05-preview-page.md) | Create /preview route | completed | 45m |
| [Phase 6](phase-06-edit-page-integration.md) | Integrate into edit page | completed | 30m |

## Key Files

### Create
- `frontend/types/api.ts` (modify)
- `frontend/components/admin/widgets/trend-hot-preview.tsx`
- `frontend/components/admin/widgets/trend-hot-editor.tsx`
- `frontend/components/admin/widgets/full-page-preview-modal.tsx`
- `frontend/app/preview/page.tsx`

### Modify
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`

## Success Criteria

- [x] Preview updates real-time when editing
- [x] Device toggle (Desktop/Mobile) works
- [x] Full-page modal renders like homepage
- [x] Active item highlighted in preview
- [x] Existing widget features unaffected

## Dependencies

- Existing: `CollectionItem`, `CollectionGridPreview`, `CollectionSlider`
- Libraries: dnd-kit (already installed)
