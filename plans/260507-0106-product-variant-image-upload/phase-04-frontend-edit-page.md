---
title: "Phase 4: Frontend – Edit Product Page"
status: completed
priority: high
completedDate: 2026-05-07
---

# Phase 4: Frontend – Edit Product Page

## Overview

Update the two sub-components used by the edit product page:
1. `product-info-panel.tsx` — add product avatar display + upload/replace
2. `product-variants-table.tsx` — add avatar column in table + avatar input in the inline add row

## Related Files

- `frontend/components/admin/product-info-panel.tsx` — add avatar in view + edit modes
- `frontend/components/admin/product-variants-table.tsx` — add avatar column + input in add row

---

## Part A: `product-info-panel.tsx`

### Step 1 – Add avatar to form state

```ts
const [form, setForm] = useState({
  name: product.name,
  category_id: product.category_id,
  default_price: String(product.default_price),
  description: product.description ?? "",
  status: String(product.status),
  avatar: product.avatar ?? "",   // ADD THIS
});
```

### Step 2 – Include avatar in save payload

```ts
await api.adminProducts.update(product.id, {
  name: form.name,
  category_id: form.category_id,
  default_price: Number(form.default_price),
  description: form.description,
  status: Number(form.status),
  avatar: form.avatar || undefined,   // ADD THIS
});
onSaved({
  ...existingFields,
  avatar: form.avatar || undefined,   // ADD THIS
});
```

### Step 3 – Avatar in view mode

Below the read-only grid, add a product image preview:

```tsx
{product.avatar && (
  <div className="mt-4">
    <span className="text-sm text-gray-500 block mb-2">Ảnh sản phẩm:</span>
    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
      <Image src={product.avatar} alt={product.name} fill className="object-cover" />
    </div>
  </div>
)}
```

### Step 4 – Avatar in edit mode

Add `ImageUploader` inside the edit grid (full-width row at the top):

```tsx
import { ImageUploader } from "@/components/admin/image-uploader";

// First item in edit grid, full-width:
<div className="md:col-span-2">
  <ImageUploader
    value={form.avatar}
    onChange={(url) => setForm((p) => ({ ...p, avatar: url }))}
    label="Ảnh sản phẩm"
  />
</div>
```

### Step 5 – Reset avatar on cancel

In `handleCancel`, reset avatar along with other fields:

```ts
setForm({
  name: product.name,
  category_id: product.category_id,
  default_price: String(product.default_price),
  description: product.description ?? "",
  status: String(product.status),
  avatar: product.avatar ?? "",   // ADD THIS
});
```

---

## Part B: `product-variants-table.tsx`

### Step 1 – Avatar column in existing variants table

Add `Ảnh` column header after the attribute columns:

```tsx
<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
  Ảnh
</th>
```

Render variant avatar in each row:

```tsx
<td className="px-4 py-2 whitespace-nowrap">
  {v.avatar ? (
    <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
      <Image src={v.avatar} alt="variant" fill className="object-cover" />
    </div>
  ) : (
    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
      <ImageIcon className="w-4 h-4 text-gray-400" />
    </div>
  )}
</td>
```

Position: after the attribute value columns, before Giá.

### Step 2 – Avatar input in the inline add row

Add `avatar` to `newVariant` initial state in `openAdd`:

```ts
const openAdd = () => {
  const empty = Object.fromEntries([
    ...attrNames.map((k) => [k, ""]),
    ["price", ""],
    ["stock", ""],
    ["avatar", ""],   // ADD THIS
  ]);
  setNewVariant(empty);
  ...
};
```

Add `ImageUploader` in the add row, in the avatar cell:

```tsx
<td className="px-4 py-2">
  <ImageUploader
    value={newVariant.avatar ?? ""}
    onChange={(url) => setNewVariant((p) => ({ ...p, avatar: url }))}
    label=""
  />
</td>
```

### Step 3 – Pass avatar to `createVariant`

```ts
const { data: created } = await api.adminProducts.createVariant(
  product.id,
  {
    attributes: attrs,
    price: Number(newVariant.price),
    stock: Number(newVariant.stock),
    avatar: newVariant.avatar || undefined,   // ADD THIS
  },
);
```

### Step 4 – Update `onVariantAdded` type handling

The `created` variant returned from the API will include `avatar`. Since `ProductVariant` already has `avatar?: string` in `types/api.ts`, no type changes needed.

---

## File Size Check

- `product-info-panel.tsx` is currently ~165 lines. Adding ~20 lines → ~185 lines. Within limit.
- `product-variants-table.tsx` is currently ~195 lines. Adding ~25 lines → ~220 lines. **Exceeds 200.**

If `product-variants-table.tsx` exceeds 200 lines after changes, extract the variant avatar display into an inline helper:

```tsx
function VariantAvatarCell({ src }: { src?: string }) {
  if (!src) return <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400" /></div>;
  return <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200"><Image src={src} alt="variant" fill className="object-cover" /></div>;
}
```

Defined at file top (no new file needed for a single-use helper).

## Notes

- In view mode, product avatar is read-only (no edit without entering edit mode) — consistent with the rest of the panel.
- For variants, there is no edit-in-place for existing variant avatars (consistent with the no-inline-edit decision from Phase 5 of the previous plan). Admin must delete and re-add the variant to change its avatar.
- `Image` from `next/image` requires `domains` or `remotePatterns` config if avatar URLs come from a different origin. Since uploads are served from the same Nginx proxy at `/uploads/...`, no config change is needed.

## Todo

**product-info-panel.tsx:**
- [ ] Add `avatar` to `form` state
- [ ] Include `avatar` in save payload and `onSaved` call
- [ ] Show avatar preview in view mode
- [ ] Add `ImageUploader` in edit mode (full-width row)
- [ ] Reset avatar in `handleCancel`

**product-variants-table.tsx:**
- [ ] Add `Ảnh` column header
- [ ] Render avatar cell in existing variant rows
- [ ] Add `avatar: ""` to `openAdd` initial state
- [ ] Add `ImageUploader` in add row's avatar cell
- [ ] Pass `avatar` to `createVariant`
- [ ] Check file length — extract `VariantAvatarCell` if >200 lines
- [ ] TypeScript check: `npx tsc --noEmit`
