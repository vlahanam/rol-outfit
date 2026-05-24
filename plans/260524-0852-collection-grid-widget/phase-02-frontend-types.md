# Phase 2: Frontend Types & Labels

**Status:** pending  
**Est:** 10 min  
**Priority:** high

## Overview

Update TypeScript types và labels cho widget type mới `collection-grid`.

## Requirements

- Update WidgetType union
- Add CollectionItem, CollectionGridMetadata interfaces
- Update WIDGET_TYPE_LABEL

## Related Files

| File | Action |
|------|--------|
| `frontend/types/api.ts` | Modify |
| `frontend/lib/api.ts` | Modify |

## Implementation Steps

### 1. Update types/api.ts

```typescript
// Add after line 244
export type WidgetType = "banner-slider" | "collection-grid" | "new-product" | "trend-hot";

// Add after BannerSliderSettings (around line 265)
export interface CollectionItem {
  id: string;
  title: string;
  image: string;
  link: string;
  cta_text: string;
}

export interface CollectionGridMetadata {
  items: CollectionItem[];
}

export interface CollectionGridSettings {
  columns?: number;  // optional: default 4
}
```

### 2. Update lib/api.ts

```typescript
// Line 18-23
export const WIDGET_TYPE_LABEL: Record<string, string> = {
  "banner-slider":    "Banner Slider",
  "collection-grid":  "Bộ sưu tập đặc biệt",  // changed from list-image
  "new-product":      "Hàng mới về",
  "trend-hot":        "Xu hướng hot",
};
```

## Todo

- [ ] Update WidgetType union in `types/api.ts`
- [ ] Add CollectionItem interface
- [ ] Add CollectionGridMetadata interface
- [ ] Add CollectionGridSettings interface (optional)
- [ ] Update WIDGET_TYPE_LABEL in `lib/api.ts`
- [ ] Run TypeScript check: `cd frontend && npx tsc --noEmit`

## Success Criteria

- [ ] No TypeScript errors
- [ ] Widget type label shows correctly in admin UI
