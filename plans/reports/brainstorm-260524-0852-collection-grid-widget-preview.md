# Brainstorm: Collection Grid Widget Preview

**Date:** 2026-05-24
**Status:** Approved
**Widget ID:** ba9b6e9d-a7e5-4b6b-9a3b-42f3f1ae5a4d

## Problem Statement

Homepage có section "Bộ sưu tập đặc biệt" với 4 CollectionCard hardcoded. Cần triển khai:
1. Widget type mới `collection-grid` (backend + frontend)
2. Preview component trong admin widget edit page
3. Editor component để quản lý items

## Requirements

### Functional
- Widget type: `collection-grid`
- Metadata: `{ items: [{id, title, image, link, cta_text}] }`
- Preview: Grid 4 cột với horizontal scroll navigation
- Editor: CRUD operations cho các items
- Device toggle: Desktop/Mobile preview

### Non-functional
- Reuse CollectionCard component cho preview
- Consistent với banner-slider pattern
- Responsive design

## Solution Design

### 1. Data Structure

```typescript
// types/api.ts
interface CollectionItem {
  id: string;
  title: string;
  image: string;
  link: string;
  cta_text: string;
}

interface CollectionGridMetadata {
  items: CollectionItem[];
}
```

### 2. Files to Modify/Create

| Scope | Action | File | Description |
|-------|--------|------|-------------|
| Backend | Add | `backend/src/internal/model/widget.go` | Add `collection-grid` to WidgetType enum |
| Backend | Update | Seeder | Update seeder với widget type mới |
| Frontend | Update | `frontend/types/api.ts` | Add types + interfaces |
| Frontend | Update | `frontend/lib/api.ts` | Add WIDGET_TYPE_LABEL |
| Frontend | Create | `frontend/components/admin/widgets/collection-grid-preview.tsx` | Preview component |
| Frontend | Create | `frontend/components/admin/widgets/collection-grid-editor.tsx` | Editor component |
| Frontend | Update | `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | Integrate preview/editor |
| Frontend | Update | `frontend/app/[locale]/(main)/page.tsx` | Fetch từ widget thay vì hardcode |

### 3. Preview Component Design

```
┌─────────────────────────────────────────────────────────────┐
│ Preview                                    [Desktop] [Mobile]│
├─────────────────────────────────────────────────────────────┤
│  ◀ │ [Card 1] [Card 2] [Card 3] [Card 4] │ ▶               │
│    │  Title    Title    Title    Title   │                  │
│    │  CTA →    CTA →    CTA →    CTA →   │                  │
└─────────────────────────────────────────────────────────────┘
```

- Desktop: 4 columns, aspect-ratio tuỳ chỉnh
- Mobile: 2 columns, smaller cards
- Navigation buttons khi items > visible columns
- Click item để select trong editor

### 4. Phases

1. **Phase 1: Backend** - Add widget type + update seeder
2. **Phase 2: Frontend Types** - Add TypeScript types
3. **Phase 3: Preview Component** - Create collection-grid-preview.tsx
4. **Phase 4: Editor Component** - Create collection-grid-editor.tsx
5. **Phase 5: Integration** - Wire up in edit page
6. **Phase 6: Storefront** - Replace hardcoded với dynamic widget

## Trade-offs

| Decision | Pro | Con |
|----------|-----|-----|
| New widget type | Clean separation, scalable | More code, DB migration |
| Reuse CollectionCard | Consistent look | May need modifications for preview context |
| Horizontal scroll | Familiar UX | More complex than simple grid |

## Success Criteria

- [ ] Backend accepts `collection-grid` widget type
- [ ] Seeder creates sample widget
- [ ] Preview shows grid with navigation
- [ ] Editor allows CRUD on items
- [ ] Desktop/Mobile toggle works
- [ ] Storefront renders from widget data

## Next Steps

Create detailed implementation plan with `/ck:plan`.
