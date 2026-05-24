# Phase 5: Edit Page Integration

**Status:** pending  
**Est:** 15 min  
**Priority:** high

## Overview

Wire `CollectionGridPreview` và `CollectionGridEditor` vào widget edit page.

## Requirements

- Conditional render khi `form.type === "collection-grid"`
- State management cho items và activeIndex
- Load existing metadata từ API
- Save metadata khi submit
- Validation: mỗi item phải có image

## Related Files

| File | Action |
|------|--------|
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | Modify |

## Implementation

### 1. Add Imports

```tsx
import { CollectionGridEditor, defaultCollectionItem } from "@/components/admin/widgets/collection-grid-editor";
import { CollectionGridPreview } from "@/components/admin/widgets/collection-grid-preview";
import type { CollectionItem, CollectionGridMetadata } from "@/types/api";
```

### 2. Add State

```tsx
const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([defaultCollectionItem()]);
const [activeCollectionItem, setActiveCollectionItem] = useState(0);
```

### 3. Update useEffect (load data)

```tsx
useEffect(() => {
  api.adminWidgets.get(id).then((res) => {
    const w = res.data;
    setForm({ name: w.name, type: w.type as WidgetType, status: w.status });
    
    // Banner slider handling (existing)
    if (w.type === "banner-slider") { ... }
    
    // Collection grid handling (new)
    if (w.type === "collection-grid") {
      const meta = w.metadata as CollectionGridMetadata | null;
      const existing = meta?.items;
      setCollectionItems(
        Array.isArray(existing) && existing.length > 0
          ? existing.map((it) => ({ ...defaultCollectionItem(), ...it }))
          : [defaultCollectionItem()]
      );
    }
  })
  .catch(...)
  .finally(...);
}, [id]);
```

### 4. Update handleSubmit (save data)

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ... existing validation

  // Collection grid validation
  if (form.type === "collection-grid") {
    const missingIdx = collectionItems.findIndex((it) => !it.image);
    if (missingIdx !== -1) {
      setActiveCollectionItem(missingIdx);
      setError(`Item ${missingIdx + 1} chưa có ảnh`);
      return;
    }
  }

  setSubmitting(true);
  try {
    const payload: UpdateWidgetPayload = { name: form.name, status: form.status };
    
    if (form.type === "banner-slider") {
      payload.metadata = { slides };
      payload.settings = { autoPlayInterval: autoPlayInterval * 1000 };
    }
    
    if (form.type === "collection-grid") {
      payload.metadata = { items: collectionItems };
    }
    
    await api.adminWidgets.update(id, payload);
    router.push("/admin/widgets");
  } catch (err) { ... }
};
```

### 5. Add JSX

```tsx
{form.type === "collection-grid" && (
  <div className="space-y-6">
    <CollectionGridPreview
      items={collectionItems}
      activeIndex={activeCollectionItem}
      onActiveChange={setActiveCollectionItem}
    />

    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700">Nội Dung Items</h2>
      <CollectionGridEditor
        items={collectionItems}
        onChange={setCollectionItems}
        activeIndex={activeCollectionItem}
        onActiveChange={setActiveCollectionItem}
      />
    </div>
  </div>
)}
```

## Todo

- [ ] Import new components and types
- [ ] Add state for collectionItems, activeCollectionItem
- [ ] Update useEffect to load collection-grid metadata
- [ ] Update handleSubmit to validate and save
- [ ] Add conditional JSX for collection-grid type
- [ ] Test full flow: load → edit → save

## Success Criteria

- [ ] Widget edit page loads collection-grid data
- [ ] Preview and editor render correctly
- [ ] Changes persist after save
- [ ] Validation prevents saving without images
