---
title: "Phase 4: Frontend – Add Product Page"
status: completed
priority: high
completed: 2026-05-07
---

# Phase 4: Frontend – Add Product Page

## Overview

Rewrite `frontend/app/admin/(protected)/products/add/page.tsx` to:
- Use `attribute_names` (list of strings) instead of hardcoded `color`/`size`/`sku` fields
- Dynamically derive variant form columns from `attribute_names`
- Wire to real API: POST product → POST each variant → redirect
- Remove dead "Thuộc tính" key/value section (no backend backing)

## Related Files

- `frontend/app/admin/(protected)/products/add/page.tsx` — full rewrite
- `frontend/lib/validations.ts` — uses `createVariantSchema` from Phase 3

## Key Design

```
┌─────────────────────────────────────────┐
│ Thông Tin Cơ Bản                        │
│  Tên sản phẩm *   Danh mục *            │
│  Giá mặc định *   Mô tả                 │
├─────────────────────────────────────────┤
│ Tên Thuộc Tính Biến Thể          [+ Thêm]│
│  [Size] [x]   [Color] [x]               │
│  (chips / tag list of attribute names)  │
├─────────────────────────────────────────┤
│ Biến Thể                         [+ Thêm]│
│  Columns: Size | Color | Giá | Tồn kho  │
│  Row 1: [S] [Đen] [150000] [10] [🗑]    │
│  (columns auto-update when attrs change)│
└─────────────────────────────────────────┘
```

## State Shape

```ts
type Variant = Record<string, string> & { price: string; stock: string };

const [attributeNames, setAttributeNames] = useState<string[]>([]);
const [newAttrInput, setNewAttrInput] = useState("");
const [variants, setVariants] = useState<Variant[]>([]);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## Implementation Steps

### Step 1 – Attribute names section

```tsx
const addAttributeName = () => {
  const trimmed = newAttrInput.trim();
  if (!trimmed || attributeNames.includes(trimmed)) return;
  setAttributeNames((prev) => [...prev, trimmed]);
  // Add the new key to every existing variant (empty value)
  setVariants((prev) => prev.map((v) => ({ ...v, [trimmed]: "" })));
  setNewAttrInput("");
};

const removeAttributeName = (name: string) => {
  setAttributeNames((prev) => prev.filter((a) => a !== name));
  // Remove the key from every variant
  setVariants((prev) =>
    prev.map((v) => {
      const next = { ...v };
      delete next[name];
      return next;
    }),
  );
};
```

UI:
```tsx
<div className="flex gap-2 flex-wrap mb-3">
  {attributeNames.map((name) => (
    <span key={name} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
      {name}
      <button type="button" onClick={() => removeAttributeName(name)}>
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  ))}
</div>
<div className="flex gap-2">
  <input
    value={newAttrInput}
    onChange={(e) => setNewAttrInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttributeName())}
    placeholder="Tên thuộc tính (vd: Size, Màu sắc)"
    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm ..."
  />
  <button type="button" onClick={addAttributeName} className="...">
    <Plus className="w-4 h-4" /> Thêm
  </button>
</div>
```

### Step 2 – Variants section (dynamic columns)

```tsx
const addVariant = () => {
  const empty = Object.fromEntries(attributeNames.map((k) => [k, ""]));
  setVariants((prev) => [...prev, { ...empty, price: "", stock: "" }]);
};

const removeVariant = (i: number) =>
  setVariants((prev) => prev.filter((_, idx) => idx !== i));

const updateVariant = (i: number, field: string, value: string) =>
  setVariants((prev) =>
    prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
  );
```

Variant table renders columns dynamically:
```tsx
{variants.map((variant, i) => (
  <div key={i} className="grid gap-3 items-start" style={{ gridTemplateColumns: `repeat(${attributeNames.length + 2}, minmax(0, 1fr)) auto` }}>
    {attributeNames.map((attr) => (
      <input
        key={attr}
        value={variant[attr] ?? ""}
        onChange={(e) => updateVariant(i, attr, e.target.value)}
        placeholder={attr}
        className={`... ${variantErrors[i]?.[attr] ? "border-red-500" : "border-gray-300"}`}
      />
    ))}
    <input value={variant.price} onChange={(e) => updateVariant(i, "price", e.target.value)} placeholder="Giá (₫)" type="number" ... />
    <input value={variant.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} placeholder="Tồn kho" type="number" ... />
    <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-red-500 ..."><Trash2 /></button>
  </div>
))}
```

Show attribute column labels as headers above variant rows.

### Step 3 – Validation

```ts
const schema = createVariantSchema(attributeNames); // from Phase 3

// validate each variant against schema
variants.forEach((variant, i) => {
  const result = schema.safeParse(variant);
  if (!result.success) { /* collect errors */ }
});
```

### Step 4 – Submit handler

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // 1. Validate product fields
  const productResult = addProductSchema.safeParse({ name, category_id, default_price, description });
  if (!productResult.success) { /* set errors, return */ }

  // 2. Validate variants
  const varSchema = createVariantSchema(attributeNames);
  // ... collect variant errors, return if any

  setSubmitting(true);
  setError(null);
  try {
    // 3. Create product
    const { data: created } = await api.adminProducts.create({
      name,
      category_id,
      default_price: Number(default_price),
      description,
      attribute_names: attributeNames,
    });

    // 4. Create each variant
    await Promise.all(
      variants.map((v) => {
        const attrs = Object.fromEntries(attributeNames.map((k) => [k, v[k]]));
        return api.adminProducts.createVariant(created.id, {
          attributes: attrs,
          price: Number(v.price),
          stock: Number(v.stock),
        });
      }),
    );

    router.push("/admin/products");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
  } finally {
    setSubmitting(false);
  }
};
```

### Step 5 – Categories from API

Replace hardcoded `<option>` list with dynamic data:

```ts
const [categories, setCategories] = useState<Category[]>([]);
useEffect(() => {
  api.get<ApiResponse<Category[]>>("/categories?limit=50")
    .then((res) => setCategories(res.data ?? []))
    .catch(() => {});
}, []);
```

### Step 6 – Error display

Show a top-level error banner when API call fails:

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
    {error}
  </div>
)}
```

### Step 7 – Submit button disabled state

```tsx
<button
  type="submit"
  disabled={submitting}
  className="bg-blue-600 text-white px-6 py-2 rounded-lg ... disabled:opacity-50"
>
  {submitting ? "Đang tạo..." : "Tạo Sản Phẩm"}
</button>
```

## Notes

- Remove the old "Thuộc tính" key/value section entirely — it has no backend backing.
- Remove `sku` field — `product_variants` has no `sku` column.
- `default_price` input type is `number`; store as `string` in state, convert with `Number()` on submit.
- Variant columns header row: show attribute names + "Giá" + "Tồn kho" + "" (delete col).
- Guard: if `attributeNames` is empty and user tries to add a variant, show inline hint "Thêm thuộc tính trước khi thêm biến thể".
- Keep file under 200 lines — extract `AttributeNamesInput` and `VariantTable` into separate component files if needed.

## Todo

- [x] Remove "Thuộc tính" key/value section
- [x] Add attribute names tag input section
- [x] Replace hardcoded `Variant` type with dynamic `Record<string,string> & {price,stock}`
- [x] Dynamic variant table with column headers
- [x] `addAttributeName` / `removeAttributeName` cascade to variants state
- [x] Load categories from API
- [x] Validation using `createVariantSchema(attributeNames)`
- [x] Submit handler: create product then create variants
- [x] Error banner + loading state
- [x] TypeScript check: `npx tsc --noEmit`
