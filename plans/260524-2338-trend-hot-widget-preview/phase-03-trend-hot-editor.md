# Phase 3: TrendHotEditor Component

**Status:** completed  
**Effort:** 45m  
**Priority:** high

## Overview

Create editor component for trend-hot items. Reuse pattern from `collection-grid-editor.tsx`.

## Files to Create

| File | Lines |
|------|-------|
| `frontend/components/admin/widgets/trend-hot-editor.tsx` | ~130 |

## Reference

Copy `collection-grid-editor.tsx` and rename:
- `CollectionGridEditor` → `TrendHotEditor`
- `defaultCollectionItem` → `defaultTrendHotItem`
- Labels Vietnamese localized

## Implementation

### Component Structure

```typescript
"use client";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { CollectionItem } from "@/types/api";

interface Props {
  items: CollectionItem[];
  onChange: (items: CollectionItem[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function defaultTrendHotItem(): CollectionItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    image: "",
    link: "",
    cta_text: "Khám Phá",  // Different default from collection
  };
}

export function TrendHotEditor({ items, onChange, activeIndex, onActiveChange }: Props) {
  // Same logic as CollectionGridEditor
}
```

### Key Differences from CollectionGridEditor

1. **Default CTA text**: "Khám Phá" instead of "Mua Ngay"
2. **Label**: "Ảnh Xu Hướng" instead of "Ảnh Collection"
3. **Export**: `defaultTrendHotItem` function

### UI Labels

| Field | Label |
|-------|-------|
| Image | Ảnh Xu Hướng |
| Title placeholder | Vd: Phong cách tối giản |
| Link placeholder | Vd: /trends/minimalist |
| CTA placeholder | Vd: Khám Phá |

## Todo

- [ ] Create trend-hot-editor.tsx
- [ ] Export defaultTrendHotItem function
- [ ] Use ImageUploader component
- [ ] Add item tabs (Item 1, Item 2, ...)
- [ ] Add/remove item buttons
- [ ] Test with edit page

## Success Criteria

- Can add/remove items
- Image upload works
- Form inputs update items
- Active item switching works
