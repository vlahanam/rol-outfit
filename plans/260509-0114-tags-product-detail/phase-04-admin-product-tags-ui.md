# Phase 04 — Admin UI: Product Tag Assignment Panel

## Context Links
- Depends on: Phase 02 (PUT /products/:id/tags), Phase 03 (Tag types + adminTags API)
- Host page: `frontend/app/admin/(protected)/products/[id]/page.tsx`
- Reference panel pattern: `frontend/components/admin/product-info-panel.tsx`, `product-attr-names-panel.tsx`
- Admin product type now includes `tags` field (added in Phase 02 backend → Phase 03 type extension)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2h
- **Description:** Add a `<ProductTagsPanel>` to the admin product edit page showing currently assigned tags with remove buttons and an "Add tag" picker that lists available (unassigned) tags. Persists via `PUT /products/:id/tags` with the full tag_ids array.

## Key Insights
- **Replace-set, not patch:** every change (add or remove) re-sends the full tag_ids array. Matches backend semantics, eliminates partial-state bugs. Optimistic UI updates state immediately; on failure, revert.
- **Cap enforcement is dual-layer:** UI disables `Add` button when `tags.length >= 3` AND backend rejects. UI message: "Tối đa 3 thẻ tag".
- **Panel state lifts to parent** — parent page already manages `product` state and re-renders panels after save (mirrors `handleAttrNamesSaved`). Add a `handleTagsSaved(tags: Tag[])` callback.
- **Tag list source:** call `api.adminTags.list({ limit: 100 })` once on panel mount (not the public endpoint — admin can assign inactive tags too).

## Requirements

### Functional
- Display current assigned tags as removable chips (X button on each)
- Show count: `2 / 3 thẻ tag`
- "Add tag" UI: dropdown or popover listing tags not already assigned
- Disable Add button when count = 3
- Save button persists changes via single PUT
- Loading state during save; error message on failure

### Non-Functional
- Panel file ≤ 200 lines
- Parent page edit ≤ 5 lines (insert panel, add handler)

## Architecture

### Component `frontend/components/admin/product-tags-panel.tsx`

```tsx
'use client';
import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Tag } from "@/types/api";

interface Props {
  productId: string;
  currentTags: Tag[];
  onSaved: (tags: Tag[]) => void;
}
```

State:
- `assigned: Tag[]` (initial = `currentTags`)
- `available: Tag[]` (loaded once)
- `pickerOpen: boolean`
- `saving: boolean`
- `error: string | null`

Logic:
- `unassigned = available.filter(t => !assigned.find(a => a.id === t.id))`
- `addTag(t: Tag)`: append to `assigned` (optimistic), close picker, call `persist(newAssigned)`
- `removeTag(id: string)`: filter from assigned (optimistic), call `persist`
- `persist(next: Tag[])`:
  ```ts
  setSaving(true);
  try {
    await api.adminProducts.assignTags(productId, next.map(t => t.id));
    onSaved(next);
  } catch (e) {
    setAssigned(prevAssigned); // revert
    setError(e instanceof ApiError ? e.message : "Lưu thất bại");
  } finally { setSaving(false); }
  ```

UI sketch:
```
┌ Thẻ Tag (2 / 3) ─────────────────────┐
│ [Áo thun #ID ✕]  [Sale ✕]            │
│ [+ Thêm thẻ tag]                     │
│   ↓ on click: dropdown with          │
│     - "Khuyến mãi"                   │
│     - "Mới"                          │
└──────────────────────────────────────┘
```

### API client extension (`api-resources.ts`)

Add to `adminProducts`:
```ts
assignTags(productId: string, tagIds: string[]): Promise<void> {
  return request<void>(`/products/${productId}/tags`, {
    method: "PUT",
    body: JSON.stringify({ tag_ids: tagIds }),
  });
},
```

### Type extension (`types/api.ts`)

Extend `AdminProduct` with `tags: Tag[]` (added in Phase 03 already if running in parallel; otherwise add here). Be defensive in panel: `currentTags = product.tags ?? []`.

### Parent page modification (`app/admin/(protected)/products/[id]/page.tsx`)

Insert panel after `ProductAttrNamesPanel`:
```tsx
import { ProductTagsPanel } from "@/components/admin/product-tags-panel";

const handleTagsSaved = (tags: Tag[]) =>
  setProduct(prev => prev ? { ...prev, tags } : prev);

// in JSX, after <ProductAttrNamesPanel>
<ProductTagsPanel
  productId={id}
  currentTags={product.tags ?? []}
  onSaved={handleTagsSaved}
/>
```

## Related Code Files

### Create
- `frontend/components/admin/product-tags-panel.tsx`

### Modify
- `frontend/lib/api-resources.ts` (add `assignTags` to `adminProducts`)
- `frontend/types/api.ts` (ensure `AdminProduct` includes `tags: Tag[]`)
- `frontend/app/admin/(protected)/products/[id]/page.tsx` (insert panel + handler)

## Implementation Steps

1. Add `assignTags` method to `adminProducts` in `api-resources.ts`
2. Confirm `AdminProduct.tags: Tag[]` exists in `types/api.ts`; add if missing
3. Build `product-tags-panel.tsx`:
   - Initial state from `currentTags` prop
   - Fetch admin tag list on mount
   - Render assigned chips + add picker
   - Implement optimistic persist with revert on error
4. Insert `<ProductTagsPanel>` and `handleTagsSaved` into product detail page
5. `tsc --noEmit` clean
6. Manual smoke:
   - Open product with no tags → add 1 → reload page → still 1
   - Add 3 → Add button disabled
   - Try removing one → list updates
   - Network kill mid-save → error shows; chip reverts

## Todo List

- [ ] `assignTags` API method added
- [ ] `AdminProduct.tags` type field present
- [ ] `product-tags-panel.tsx` created (≤ 200 lines)
- [ ] Picker shows only unassigned tags
- [ ] Add button disabled at 3 tags
- [ ] Optimistic update + error revert verified
- [ ] Parent page imports + renders panel
- [ ] No TS errors
- [ ] Manual smoke matrix passes

## Success Criteria
- Admin can add up to 3 tags to a product
- Removing a tag and saving persists across reload
- Attempting to add a 4th is prevented (UI) and rejected (server) — error visible
- Panel state stays consistent with parent product state
- File line budget respected

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Race: add + remove in quick succession | Disable buttons while `saving` is true; serialize via single in-flight promise |
| Empty tags array: did backend accept? | Backend explicitly handles `[]` as "clear all"; UI sends empty list when last chip removed |
| Tag list endpoint pagination cuts off | Use `limit=100`; if real-world exceeds, future-Phase adds search-in-picker (YAGNI now) |
| Stale `available` after a tag is created in another tab | Acceptable — admin can refresh; not a critical path |
| `currentTags` prop drift from server truth on revert | Track `prevAssigned` snapshot before each persist call |

## Security Considerations
- Endpoint admin-protected at backend
- No client-only validation bypass risk (cap enforced server-side)

## Next Steps
- After Phase 04 lands, Phase 05 can rely on the public product GET returning tags for users
