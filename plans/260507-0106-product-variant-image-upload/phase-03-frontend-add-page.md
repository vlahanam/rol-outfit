---
title: "Phase 3: Frontend – Add Product Page"
status: completed
priority: high
completedDate: 2026-05-07
---

# Phase 3: Frontend – Add Product Page

## Overview

Update `frontend/app/admin/(protected)/products/add/page.tsx` to:
- Add **required** product avatar upload (using `ImageUploader`)
- Add **optional** per-variant avatar upload in each variant row

## Related Files

- `frontend/app/admin/(protected)/products/add/page.tsx` — add avatar state + `ImageUploader` in product info section and variant rows

## Implementation Steps

### Step 1 – Product avatar state

Add to the existing state block:

```ts
const [productAvatar, setProductAvatar] = useState("");
```

### Step 2 – Product avatar validation

In the submit handler, after `addProductSchema.safeParse`, add:

```ts
if (!productAvatar) {
  setFieldErrors((p) => ({ ...p, avatar: "Vui lòng chọn ảnh sản phẩm" }));
  return;
}
setFieldErrors((p) => { const next = { ...p }; delete next.avatar; return next; });
```

### Step 3 – Pass avatar to `api.adminProducts.create`

```ts
const { data: created } = await api.adminProducts.create({
  name,
  category_id: categoryId,
  default_price: Number(defaultPrice),
  description,
  attribute_names: attributeNames,
  avatar: productAvatar,   // ADD THIS
});
```

### Step 4 – Product avatar UI

In the "Thông Tin Cơ Bản" section, add an `ImageUploader` **above** the name/category grid:

```tsx
import { ImageUploader } from "@/components/admin/image-uploader";

// Inside the basic info card:
<ImageUploader
  value={productAvatar}
  onChange={(url) => {
    setProductAvatar(url);
    if (url) setFieldErrors((p) => { const n = { ...p }; delete n.avatar; return n; });
  }}
  required
  label="Ảnh sản phẩm"
  error={fieldErrors.avatar}
/>
```

### Step 5 – Variant avatar state

The `Variant` type already extends `Record<string, string>`. Avatar can use the same map:

```ts
// When adding a new variant, include an avatar slot:
const addVariant = () => {
  const empty = Object.fromEntries([
    ...attributeNames.map((k) => [k, ""]),
    ["price", ""],
    ["stock", ""],
    ["avatar", ""],   // ADD THIS
  ]) as Variant;
  setVariants((prev) => [...prev, empty]);
};
```

### Step 6 – Variant avatar UI

In the variant row grid, add an `ImageUploader` as the last cell before the delete button:

```tsx
// Add to grid template columns: append "5rem" before "2rem" (delete button)
style={{ gridTemplateColumns: `repeat(${attributeNames.length + 2}, minmax(0, 1fr)) 5rem 2rem` }}

// After the stock input:
<div>
  <ImageUploader
    value={variant.avatar ?? ""}
    onChange={(url) => updateVariant(i, "avatar", url)}
    label="Ảnh"
  />
</div>
```

Also add "Ảnh" to the column headers row.

### Step 7 – Pass avatar to `createVariant`

In the submit handler:

```ts
return api.adminProducts.createVariant(created.id, {
  attributes: attrs,
  price: Number(v.price),
  stock: Number(v.stock),
  avatar: v.avatar || undefined,   // ADD THIS — omit if empty
});
```

### Step 8 – addAttributeName cascade

`avatar` is a special key that should NOT be added/removed by `addAttributeName`/`removeAttributeName`. Guard already works because `addAttributeName` checks `attributeNames.includes(trimmed)` — as long as "avatar" is never in `attributeNames`, the cascade is safe. No code change needed.

## Notes

- `ImageUploader` is positioned in the variant row as a compact 80×80 box — fits in the grid without overflow.
- The `avatar` key in the `Variant` record is a reserved internal key, not a variant attribute key. The two concepts are separate: `attributeNames` = variant schema, `avatar` = image field.
- When `attributeNames` changes (add/remove), `avatar` key persists in variants because the cascade only processes keys in `attributeNames`.

## Todo

- [ ] Add `productAvatar` state
- [ ] Add avatar validation in submit handler
- [ ] Pass `avatar: productAvatar` to `api.adminProducts.create`
- [ ] Add `ImageUploader` for product avatar in basic info section
- [ ] Add `avatar: ""` to `addVariant` initial object
- [ ] Add `ImageUploader` in variant row grid
- [ ] Update grid column template to include avatar column
- [ ] Add "Ảnh" header to variant column headers
- [ ] Pass `avatar: v.avatar || undefined` to `createVariant`
- [ ] TypeScript check: `npx tsc --noEmit`
