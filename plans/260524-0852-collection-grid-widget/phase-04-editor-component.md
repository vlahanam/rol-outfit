# Phase 4: Editor Component

**Status:** pending  
**Est:** 30 min  
**Priority:** high

## Overview

Create `collection-grid-editor.tsx` cho CRUD operations trên collection items.

## Requirements

- Tab selector cho items (Item 1, Item 2, ...)
- Add item button
- Image uploader
- Text fields: title, link, cta_text
- Remove item button
- Sync với preview qua activeIndex

## Related Files

| File | Action |
|------|--------|
| `frontend/components/admin/widgets/collection-grid-editor.tsx` | Create |
| `frontend/components/admin/widgets/banner-slider-editor.tsx` | Reference |
| `frontend/components/admin/image-uploader.tsx` | Use |

## Implementation

### Props Interface

```typescript
interface Props {
  items: CollectionItem[];
  onChange: (items: CollectionItem[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}
```

### Helper Function

```typescript
export function defaultCollectionItem(): CollectionItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    image: "",
    link: "",
    cta_text: "Mua Ngay",
  };
}
```

### Component Structure

```
┌──────────────────────────────────────────────────────┐
│ [Item 1] [Item 2] [Item 3] [+ Thêm Item]            │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ Ảnh Collection                                   │ │
│ │ [Image Uploader]                                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Tiêu đề                                              │
│ [________________________]                           │
│                                                      │
│ Đường dẫn                                            │
│ [________________________]                           │
│                                                      │
│ Nút CTA                                              │
│ [________________________]                           │
│                                                      │
│                              [Xóa item này]         │
└──────────────────────────────────────────────────────┘
```

### Code Template

```tsx
"use client";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { CollectionItem } from "@/types/api";

interface Props {
  items: CollectionItem[];
  onChange: (items: CollectionItem[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function defaultCollectionItem(): CollectionItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    image: "",
    link: "",
    cta_text: "Mua Ngay",
  };
}

export function CollectionGridEditor({ items, onChange, activeIndex, onActiveChange }: Props) {
  const item = items[activeIndex];

  const update = (patch: Partial<CollectionItem>) => {
    onChange(items.map((it, i) => (i === activeIndex ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    const next = [...items, defaultCollectionItem()];
    onChange(next);
    onActiveChange(next.length - 1);
  };

  const removeItem = () => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== activeIndex);
    onChange(next);
    onActiveChange(Math.min(activeIndex, next.length - 1));
  };

  return (
    <div className="space-y-4">
      {/* Item tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onActiveChange(i)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              i === activeIndex
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            Item {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          + Thêm Item
        </button>
      </div>

      {/* Active item editor */}
      {item && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <ImageUploader
            label="Ảnh Collection"
            value={item.image}
            onChange={(url) => update({ image: url })}
            required
          />

          <div className="grid gap-3">
            <ItemField
              label="Tiêu đề"
              value={item.title}
              onChange={(v) => update({ title: v })}
              placeholder="Vd: Thời trang công sở"
            />
            <ItemField
              label="Đường dẫn"
              value={item.link}
              onChange={(v) => update({ link: v })}
              placeholder="Vd: /collections/office"
            />
            <ItemField
              label="Nút CTA"
              value={item.cta_text}
              onChange={(v) => update({ cta_text: v })}
              placeholder="Vd: Mua Ngay"
            />
          </div>

          {items.length > 1 && (
            <div className="flex justify-end">
              <button type="button" onClick={removeItem} className="text-sm text-red-500 hover:text-red-600">
                Xóa item này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
```

## Todo

- [ ] Create `collection-grid-editor.tsx`
- [ ] Export `defaultCollectionItem()` function
- [ ] Implement item tabs with active state
- [ ] Add "Thêm Item" button
- [ ] Integrate ImageUploader
- [ ] Add text fields (title, link, cta_text)
- [ ] Add remove item button (hide when items.length <= 1)
- [ ] Test add/edit/remove operations

## Success Criteria

- [ ] Can add new items
- [ ] Can edit existing items
- [ ] Can remove items (except last one)
- [ ] Tab selection syncs with preview
- [ ] Image upload works
