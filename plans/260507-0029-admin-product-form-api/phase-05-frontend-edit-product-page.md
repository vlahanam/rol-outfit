---
title: "Phase 5: Frontend – Edit Product Page"
status: completed
priority: high
completed: 2026-05-07
---

# Phase 5: Frontend – Edit Product Page

## Overview

Full rewrite of `frontend/app/admin/(protected)/products/[id]/page.tsx`. Replace all hardcoded mock data with real API calls. Add inline editing for basic info, attribute names management, and full variant CRUD.

## Related Files

- `frontend/app/admin/(protected)/products/[id]/page.tsx` — full rewrite

## Page Layout

```
┌─────────────────────────────────────────────┐
│ ← Chi Tiết Sản Phẩm   ID: #abc12345         │
├─────────────────────────────────────────────┤
│ Thông Tin Cơ Bản                [Chỉnh sửa] │
│  Tên | Danh mục | Giá | Trạng thái | Mô tả  │
├─────────────────────────────────────────────┤
│ Thuộc Tính Biến Thể             [Chỉnh sửa] │
│  [Size ×] [Màu sắc ×]                       │
│  (edit mode: add/remove chips + Save)        │
├─────────────────────────────────────────────┤
│ Biến Thể                          [+ Thêm]  │
│  table: Size | Màu sắc | Giá | Tồn kho |    │
│         Đã Bán | Trạng thái | Actions        │
│  (inline add row at bottom of table)         │
└─────────────────────────────────────────────┘
```

## State Shape

```ts
const [product, setProduct] = useState<AdminProduct | null>(null);
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Basic info edit
const [editInfo, setEditInfo] = useState(false);
const [infoForm, setInfoForm] = useState({ name:"", category_id:"", default_price:"", description:"", status:"1" });
const [infoSaving, setInfoSaving] = useState(false);

// Attribute names edit
const [editAttrs, setEditAttrs] = useState(false);
const [attrNames, setAttrNames] = useState<string[]>([]);
const [newAttrInput, setNewAttrInput] = useState("");
const [attrsSaving, setAttrsSaving] = useState(false);

// New variant row
const [showAddVariant, setShowAddVariant] = useState(false);
const [newVariant, setNewVariant] = useState<Record<string,string>>({});
const [addVariantError, setAddVariantError] = useState<string | null>(null);
const [variantSaving, setVariantSaving] = useState(false);

// Delete
const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);
```

## Implementation Steps

### Step 1 – Load data on mount

```ts
const { id } = useParams<{ id: string }>();

useEffect(() => {
  const load = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.adminProducts.get(id),
        api.get<ApiResponse<Category[]>>("/categories?limit=50"),
      ]);
      const p = prodRes.data;
      setProduct(p);
      setAttrNames(p.attribute_names ?? []);
      setInfoForm({
        name: p.name,
        category_id: p.category_id,
        default_price: String(p.default_price),
        description: p.description ?? "",
        status: String(p.status),
      });
      setCategories(catRes.data ?? []);
    } catch {
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };
  load();
}, [id]);
```

### Step 2 – Basic info section (inline edit, same pattern as current page)

**View mode**: read-only grid (name, category, price, status, description).

**Edit mode**: inputs + Save/Cancel buttons.

Save handler:
```ts
const saveInfo = async () => {
  setInfoSaving(true);
  try {
    await api.adminProducts.update(id, {
      name: infoForm.name,
      category_id: infoForm.category_id,
      default_price: Number(infoForm.default_price),
      description: infoForm.description,
      status: Number(infoForm.status) as 1 | 2,
    });
    setProduct((prev) => prev ? {
      ...prev,
      name: infoForm.name,
      category_id: infoForm.category_id,
      default_price: Number(infoForm.default_price),
      description: infoForm.description,
      status: Number(infoForm.status),
    } : prev);
    setEditInfo(false);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Lỗi khi lưu");
  } finally {
    setInfoSaving(false);
  }
};
```

### Step 3 – Attribute names section (inline edit)

**View mode**: chips displaying each attribute name.

**Edit mode**: chips with × remove + input to add new.

```ts
const addAttrName = () => {
  const t = newAttrInput.trim();
  if (!t || attrNames.includes(t)) return;
  setAttrNames((p) => [...p, t]);
  setNewAttrInput("");
};

const removeAttrName = (name: string) =>
  setAttrNames((p) => p.filter((a) => a !== name));

const saveAttrs = async () => {
  setAttrsSaving(true);
  try {
    await api.adminProducts.update(id, { attribute_names: attrNames });
    setProduct((prev) => prev ? { ...prev, attribute_names: attrNames } : prev);
    setEditAttrs(false);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Lỗi khi lưu");
  } finally {
    setAttrsSaving(false);
  }
};
```

> **Warning note**: When attribute names change, existing variants are NOT automatically updated. Show an info banner: _"Lưu ý: thay đổi tên thuộc tính không tự động cập nhật các biến thể hiện có."_ This is intentional — a bulk migrate would be scope creep.

### Step 4 – Variant table

Columns: `attribute_names` (dynamic) + Giá + Tồn kho + Đã Bán + Trạng thái + Hành động.

Display `variant.attributes[attr] ?? "—"` for each attribute column.

Status badge: `status === 1 → "Hiển thị"` (green), else `"Ẩn"` (gray).

### Step 5 – Add variant (inline row at table bottom)

When `showAddVariant` is true, render an extra row with inputs:

```ts
const initNewVariant = () => {
  const empty = Object.fromEntries([
    ...product!.attribute_names.map((k) => [k, ""]),
    ["price", ""],
    ["stock", ""],
  ]);
  setNewVariant(empty);
  setShowAddVariant(true);
};

const submitNewVariant = async () => {
  const schema = createVariantSchema(product!.attribute_names);
  const result = schema.safeParse(newVariant);
  if (!result.success) {
    setAddVariantError("Vui lòng điền đầy đủ thông tin biến thể");
    return;
  }
  setVariantSaving(true);
  try {
    const attrs = Object.fromEntries(
      product!.attribute_names.map((k) => [k, newVariant[k]]),
    );
    const { data: created } = await api.adminProducts.createVariant(id, {
      attributes: attrs,
      price: Number(newVariant.price),
      stock: Number(newVariant.stock),
    });
    setProduct((prev) =>
      prev ? { ...prev, variants: [...prev.variants, created], variant_count: prev.variant_count + 1 } : prev,
    );
    setShowAddVariant(false);
    setAddVariantError(null);
  } catch (err) {
    setAddVariantError(err instanceof Error ? err.message : "Lỗi khi thêm biến thể");
  } finally {
    setVariantSaving(false);
  }
};
```

### Step 6 – Delete variant

Use existing `DeleteConfirmModal`:

```ts
const confirmDeleteVariant = async () => {
  if (!deleteVariantId) return;
  try {
    await api.adminProducts.removeVariant(id, deleteVariantId);
    setProduct((prev) =>
      prev ? {
        ...prev,
        variants: prev.variants.filter((v) => v.id !== deleteVariantId),
        variant_count: prev.variant_count - 1,
      } : prev,
    );
  } catch {
    // show toast or ignore
  } finally {
    setDeleteVariantId(null);
  }
};
```

### Step 7 – Loading / error states

```tsx
if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
if (!product) return null;
```

### Step 8 – File size management

If the file exceeds 200 lines, extract into sub-components:

| Component | File |
|-----------|------|
| Basic info panel | `components/admin/product-info-panel.tsx` |
| Attribute names panel | `components/admin/product-attr-names-panel.tsx` |
| Variant table + add row | `components/admin/product-variants-table.tsx` |

Each sub-component receives data + callbacks as props — no API calls inside them.

## Notes

- Use `DeleteConfirmModal` (already exists at `components/admin/DeleteConfirmModal`) for variant delete confirmation.
- Import `Category`, `AdminProduct`, `ProductVariant` from `@/types/api`.
- `status` field for product: `1 = Hiển thị`, `2 = Ẩn`. Render as select in edit mode.
- No "edit variant" inline — keeping it simpler; delete and re-create is sufficient for now. (Edit variant in-place would require a modal which is out of scope.)
- `attribute_names` save sends full array (replace semantics) — matches `UpdateProductRequest` which uses `[]string` replace.

## Todo

- [x] Load product + categories on mount (`api.adminProducts.get`)
- [x] Loading/error states
- [x] Basic info section: view mode + inline edit + save to API
- [x] Attribute names section: view mode (chips) + inline edit (add/remove) + save to API
- [x] Warning banner on attribute names change
- [x] Variant table with dynamic `attribute_names` columns
- [x] Add variant inline row (`showAddVariant` toggle + `submitNewVariant`)
- [x] Delete variant with `DeleteConfirmModal`
- [x] Extract sub-components if file >200 lines
- [x] TypeScript check: `npx tsc --noEmit`
