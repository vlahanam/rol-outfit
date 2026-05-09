# Phase 05 — Frontend Admin Forms

**Status:** done | **Effort:** 1.5h | **Depends on:** Phase 04

## Files to Modify

| File | Change |
|------|--------|
| `frontend/components/admin/product-info-panel.tsx` | Add discount section to edit form + view display |
| `frontend/app/admin/(protected)/products/add/page.tsx` | Add discount section |
| `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx` | Add discount section |

---

## Shared discount form pattern

Both product and variant forms need the same 3 inputs. Extract into a reusable inline block (not a component — too small for YAGNI):

```tsx
{/* Discount Section */}
<div className="border-t border-gray-200 pt-4 mt-2">
  <h3 className="text-sm font-semibold text-gray-700 mb-3">Giảm giá</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phần trăm giảm (%)
      </label>
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
        placeholder="0"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Bắt đầu
      </label>
      <input
        type="datetime-local"
        value={discountStartAt}
        onChange={(e) => setDiscountStartAt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Kết thúc
      </label>
      <input
        type="datetime-local"
        value={discountEndAt}
        onChange={(e) => setDiscountEndAt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</div>
```

### datetime-local ↔ RFC3339 conversion helpers (inline or in lib/utils)

```ts
// RFC3339 → datetime-local string ("2026-05-09T10:00")
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "2026-05-09T10:00:00Z" → "2026-05-09T10:00"
}

// datetime-local string → ISO string for API
function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}
```

---

## product-info-panel.tsx

### Form state additions

```ts
const [form, setForm] = useState({
  // ... existing ...
  discount_percent: String(product.discount_percent ?? 0),
  discount_start_at: toDatetimeLocal(product.discount_start_at ?? null),
  discount_end_at: toDatetimeLocal(product.discount_end_at ?? null),
});
```

### handleSave — include in update payload

```ts
await api.adminProducts.update(product.id, {
  // ... existing ...
  discount_percent: Number(form.discount_percent) || 0,
  discount_start_at: fromDatetimeLocal(form.discount_start_at),
  discount_end_at: fromDatetimeLocal(form.discount_end_at),
});
```

### handleCancel — reset discount fields

```ts
setForm({
  // ... existing ...
  discount_percent: String(product.discount_percent ?? 0),
  discount_start_at: toDatetimeLocal(product.discount_start_at ?? null),
  discount_end_at: toDatetimeLocal(product.discount_end_at ?? null),
});
```

### Edit mode — add discount section below description (md:col-span-2)

```tsx
<div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
  <h3 className="text-sm font-semibold text-gray-700 mb-3">Giảm giá</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm (%)</label>
      <input type="number" min="0" max="100" step="0.01"
        value={form.discount_percent}
        onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ..."
      />
    </div>
    <div>
      <label ...>Bắt đầu</label>
      <input type="datetime-local" value={form.discount_start_at}
        onChange={(e) => setForm((p) => ({ ...p, discount_start_at: e.target.value }))} ... />
    </div>
    <div>
      <label ...>Kết thúc</label>
      <input type="datetime-local" value={form.discount_end_at}
        onChange={(e) => setForm((p) => ({ ...p, discount_end_at: e.target.value }))} ... />
    </div>
  </div>
</div>
```

### View mode — show discount info (if active)

```tsx
{product.discount_percent > 0 && (
  <div className="md:col-span-2">
    <span className="text-gray-500">Giảm giá:</span>
    <span className="ml-2 font-medium text-red-600">{product.discount_percent}%</span>
    {product.sale_price < product.default_price && (
      <span className="ml-2 text-gray-500 text-xs">
        → {product.sale_price.toLocaleString("vi-VN")}₫
      </span>
    )}
    {(product.discount_start_at || product.discount_end_at) && (
      <span className="ml-2 text-xs text-gray-400">
        {product.discount_start_at ? new Date(product.discount_start_at).toLocaleString("vi-VN") : ""}
        {" – "}
        {product.discount_end_at ? new Date(product.discount_end_at).toLocaleString("vi-VN") : "∞"}
      </span>
    )}
  </div>
)}
```

---

## products/add/page.tsx

### State additions

```ts
const [discountPercent, setDiscountPercent] = useState("0");
const [discountStartAt, setDiscountStartAt] = useState("");
const [discountEndAt, setDiscountEndAt] = useState("");
```

### handleSubmit — include in create payload

```ts
await api.adminProducts.create({
  // ... existing ...
  discount_percent: Number(discountPercent) || 0,
  discount_start_at: fromDatetimeLocal(discountStartAt),
  discount_end_at: fromDatetimeLocal(discountEndAt),
});
```

### JSX — add discount section inside "Basic Info" card, after description field

---

## variants/[variantId]/page.tsx

### State additions

```ts
const [discountPercent, setDiscountPercent] = useState("0");
const [discountStartAt, setDiscountStartAt] = useState("");
const [discountEndAt, setDiscountEndAt] = useState("");
```

### useEffect — populate from loaded variant

```ts
setDiscountPercent(String(v.discount_percent ?? 0));
setDiscountStartAt(toDatetimeLocal(v.discount_start_at ?? null));
setDiscountEndAt(toDatetimeLocal(v.discount_end_at ?? null));
```

### handleSave — include in update payload

```ts
await api.adminProducts.updateVariant(id, variantId, {
  // ... existing ...
  discount_percent: Number(discountPercent) || 0,
  discount_start_at: fromDatetimeLocal(discountStartAt),
  discount_end_at: fromDatetimeLocal(discountEndAt),
});
```

### JSX — add discount section after status field

---

## File size check

- `product-info-panel.tsx` currently ~245 lines → will grow ~40 lines → ~285 lines (under 200 limit per component is aspirational; if over, extract discount section to inline block)
- `add/page.tsx` currently ~488 lines → already over limit → consider extracting `DiscountFields` component but YAGNI says add inline for now

## Todo

- [x] Add `toDatetimeLocal` / `fromDatetimeLocal` helpers (inline or in `lib/utils.ts`)
- [x] Update `product-info-panel.tsx`: form state, edit UI, view UI, save/cancel logic
- [x] Update `products/add/page.tsx`: state, submit payload, JSX
- [x] Update `variants/[variantId]/page.tsx`: state, load, save, JSX
- [x] `npx tsc --noEmit` — no new errors
