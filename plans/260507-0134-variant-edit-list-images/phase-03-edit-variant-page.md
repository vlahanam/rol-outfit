# Phase 03 — Create Variant Edit Page

## Context Links
- Plan overview: [plan.md](./plan.md)
- New file: `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx`
- API used: `api.adminProducts.get(productId)` and `api.adminProducts.updateVariant(productId, variantId, payload)`
- Reference for layout: `frontend/app/admin/(protected)/products/[id]/page.tsx` (product edit page — card pattern, ImageUploader usage)

## Overview
- **Priority**: High
- **Status**: completed
- **Effort**: 1.5h
- **Completed**: 2026-05-07
- **Description**: Create a dedicated variant edit page. On load, fetch the parent product (which includes variants and `attribute_names`), find the target variant, pre-fill a form with avatar/attributes/price/stock/status, and submit via `updateVariant`. Redirect back to product edit page on success.

## Key Insights
- `api.adminProducts.get(productId)` returns the full `AdminProduct` (including `variants` and `attribute_names`) — single API call covers everything; no need for a separate `getVariant` helper (YAGNI)
- `attribute_names: string[]` drives the dynamic attribute form fields; pre-fill values from `variant.attributes` (object keyed by attribute name)
- Status values: `1 = "Hiển thị"`, `2 = "Ẩn"` (consistent with product status — confirm by reading product edit page or `ProductInfoPanel`)
- `UpdateVariantPayload` allows partial updates — but for a full edit form we send all fields each save
- Validation rules from backend `UpdateVariantRequest.Validate()`: price ≥ 0, stock ≥ 0, attributes JSON object if provided

## Requirements
### Functional
- Route `/admin/products/[id]/variants/[variantId]` (Next.js dynamic params)
- Loads variant data on mount; shows loading state
- If variant or product not found: show error state with link back to products list
- Form fields:
  - Avatar (ImageUploader)
  - Dynamic attribute inputs (one per `product.attribute_names`)
  - Price (number input, ≥ 0)
  - Stock (number input, integer ≥ 0)
  - Status (select: Hiển thị / Ẩn)
- Save button: calls `api.adminProducts.updateVariant(id, variantId, payload)`, shows success toast, redirects to `/admin/products/{id}`
- Cancel button: navigates back to `/admin/products/{id}` without saving
- Back link at top: `← Quay lại sản phẩm`
- Title: `Chỉnh Sửa Biến Thể`

### Non-functional
- File under 200 lines — if exceeded, extract form into a sub-component (e.g., `variant-edit-form.tsx`)
- Vietnamese labels throughout
- Consistent card-based layout with product edit page
- All `<Image>` components serving `/uploads/` use `unoptimized`

## Architecture
```
/admin/products/[id]/variants/[variantId]/page.tsx
  ├── on mount: fetch api.adminProducts.get(id)
  │     ├── find variant by variantId in product.variants
  │     ├── if not found → error UI
  │     └── set form state from variant + product.attribute_names
  ├── render
  │     ├── back link
  │     ├── title
  │     └── card
  │           ├── ImageUploader (avatar)
  │           ├── grid: attribute inputs (dynamic from attribute_names)
  │           ├── price input
  │           ├── stock input
  │           └── status select
  │     └── action row: [Cancel] [Save]
  └── submit
        ├── client validation (price ≥ 0, stock ≥ 0, all attributes filled)
        ├── api.adminProducts.updateVariant(id, variantId, payload)
        ├── toast success
        └── router.push(`/admin/products/${id}`)
```

### Data flow
- Inputs: route params `{ id: string, variantId: string }` (parse to numbers)
- Fetch: `AdminProduct` via `adminProducts.get(id)`
- State: `attributes: Record<string, string>`, `price: string`, `stock: string`, `avatar: string`, `status: number`
- Output: `UpdateVariantPayload` to `adminProducts.updateVariant`

## Related Code Files
### Create
- `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx`
- (Optional, if file exceeds 200 lines) `frontend/components/admin/variant-edit-form.tsx`

### Read for context
- `frontend/app/admin/(protected)/products/[id]/page.tsx` — card layout pattern, ImageUploader usage, status select pattern
- `frontend/components/admin/product-info-panel.tsx` (or wherever status is rendered) — confirm status enum values
- `frontend/components/admin/product-variants-table.tsx` — ImageUploader integration reference
- `frontend/lib/api.ts` — `adminProducts.get`, `adminProducts.updateVariant` signatures
- `frontend/types/api.ts` — `AdminProduct`, `ProductVariant`, `UpdateVariantPayload`

## Implementation Steps

1. **Read references**
   - `frontend/app/admin/(protected)/products/[id]/page.tsx` for layout/card/ImageUploader/status patterns
   - `frontend/lib/api.ts` to confirm signatures
   - `frontend/types/api.ts` to confirm types
   - Confirm status enum values (1 = Hiển thị, 2 = Ẩn) by reading the product info panel

2. **Create directory**
   - `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/`

3. **Create `page.tsx`**
   - `"use client"` directive
   - Imports:
     - `useEffect`, `useState` from `react`
     - `useRouter`, `useParams` from `next/navigation`
     - `Link` from `next/link`
     - `ArrowLeft` from `lucide-react`
     - `api` from `@/lib/api`
     - `AdminProduct`, `ProductVariant`, `UpdateVariantPayload` from `@/types/api`
     - UI primitives (Card, Input, Label, Button, Select, etc.) from existing UI library
     - `ImageUploader` (path matches existing usage in `product-variants-table.tsx`)
     - `toast` (whichever toast library project uses — check from product edit page)

4. **Component logic**
   ```tsx
   export default function EditVariantPage() {
     const router = useRouter()
     const params = useParams<{ id: string; variantId: string }>()
     const productId = Number(params.id)
     const variantId = Number(params.variantId)

     const [product, setProduct] = useState<AdminProduct | null>(null)
     const [variant, setVariant] = useState<ProductVariant | null>(null)
     const [attributes, setAttributes] = useState<Record<string, string>>({})
     const [price, setPrice] = useState("")
     const [stock, setStock] = useState("")
     const [avatar, setAvatar] = useState("")
     const [status, setStatus] = useState<number>(1)
     const [loading, setLoading] = useState(true)
     const [saving, setSaving] = useState(false)
     const [error, setError] = useState<string | null>(null)

     useEffect(() => {
       async function load() {
         try {
           const p = await api.adminProducts.get(productId)
           const v = p.variants.find(x => x.id === variantId)
           if (!v) { setError("Không tìm thấy biến thể"); return }
           setProduct(p); setVariant(v)
           setAttributes(v.attributes ?? {})
           setPrice(String(v.price)); setStock(String(v.stock))
           setAvatar(v.avatar ?? ""); setStatus(v.status)
         } catch (e) {
           setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu")
         } finally { setLoading(false) }
       }
       load()
     }, [productId, variantId])
   ```

5. **Submit handler**
   ```tsx
   async function handleSave() {
     // client validation
     const priceNum = Number(price)
     const stockNum = Number(stock)
     if (Number.isNaN(priceNum) || priceNum < 0) { toast.error("Giá không hợp lệ"); return }
     if (!Number.isInteger(stockNum) || stockNum < 0) { toast.error("Tồn kho không hợp lệ"); return }
     if (product) {
       for (const name of product.attribute_names) {
         if (!attributes[name]?.trim()) { toast.error(`Thuộc tính "${name}" không được trống`); return }
       }
     }
     setSaving(true)
     try {
       await api.adminProducts.updateVariant(productId, variantId, {
         attributes, price: priceNum, stock: stockNum, avatar, status,
       })
       toast.success("Đã cập nhật biến thể")
       router.push(`/admin/products/${productId}`)
     } catch (e) {
       toast.error(e instanceof Error ? e.message : "Lỗi cập nhật")
     } finally { setSaving(false) }
   }
   ```

6. **Render**
   - Loading: spinner / skeleton
   - Error: error message + back link
   - Success: full form
     - Back link: `<Link href={\`/admin/products/${productId}\`}><ArrowLeft /> Quay lại sản phẩm</Link>`
     - `<h1>Chỉnh Sửa Biến Thể</h1>`
     - `<Card>` containing:
       - `<ImageUploader value={avatar} onChange={setAvatar} />`
       - Grid of attribute inputs: `product.attribute_names.map(name => <Input value={attributes[name] ?? ""} onChange={e => setAttributes({...attributes, [name]: e.target.value})} />)`
       - Price input (`type="number"`, `min={0}`, `step="0.01"`)
       - Stock input (`type="number"`, `min={0}`, `step="1"`)
       - Status select with options 1/2
     - Action row: `<Button variant="outline" onClick={() => router.back()}>Hủy</Button>` and `<Button onClick={handleSave} disabled={saving}>Lưu</Button>`

7. **File size check**
   - If `page.tsx` exceeds 200 lines, extract the form JSX into `frontend/components/admin/variant-edit-form.tsx`
   - The form component takes initial values + onSubmit callback; page handles fetch/state/redirect

8. **Compile check**
   - `cd frontend && pnpm tsc --noEmit` — must succeed
   - Run `pnpm dev` and manually navigate to verify route resolves and data loads

## Todo List
- [x] Read product edit page for layout/UI primitive references
- [x] Read `frontend/lib/api.ts` to confirm `adminProducts.get` and `updateVariant` signatures
- [x] Read `frontend/types/api.ts` for `AdminProduct`, `ProductVariant`, `UpdateVariantPayload`
- [x] Confirm status enum values (1 = Hiển thị, 2 = Ẩn)
- [x] Create directory `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/`
- [x] Create `page.tsx` with `"use client"` directive
- [x] Implement params parsing and state hooks
- [x] Implement `useEffect` data load (fetch product, find variant, populate state)
- [x] Implement loading and error states
- [x] Implement form render with ImageUploader + dynamic attributes + price + stock + status
- [x] Implement `handleSave` with client-side validation
- [x] Wire Cancel button (router.back or push to product edit page)
- [x] Wire Save button to `handleSave`, show toasts, redirect on success
- [x] Verify file under 200 lines (extract `variant-edit-form.tsx` if not)
- [x] Run TS compile check — zero errors
- [x] Manual smoke test in dev: navigate from list page edit button, edit, save, confirm redirect

## Success Criteria
- Route `/admin/products/[id]/variants/[variantId]` resolves and renders
- Loading state shown while fetching
- Form pre-filled with current variant data
- Editing fields and clicking Save calls `updateVariant` and redirects to product edit page
- Toast on success and on error
- Cancel returns to product edit page without saving
- File under 200 lines
- TS compile passes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Status enum mismatch | Medium | Medium | Confirm values from existing UI before coding |
| ImageUploader prop API differs from variants table usage | Medium | Low | Match exact props from `product-variants-table.tsx` |
| Variant `attributes` field shape varies | Low | Medium | Type from `types/api.ts` is the source of truth; default to `{}` |
| File exceeds 200 lines | High | Medium | Pre-plan extraction to `variant-edit-form.tsx` if needed |
| Toast lib not consistent with rest of app | Medium | Low | Read product edit page to find the lib in use |
| Backend rejects payload due to validation drift | Low | Medium | Mirror `UpdateVariantRequest.Validate()` rules client-side |

## Security Considerations
- Route is under `(protected)` admin route group — auth handled by middleware
- No new sensitive data exposure (variant data already accessible via existing endpoints)
- Backend re-validates on PUT — client validation is UX-only, not a security boundary

## Rollback
- Delete the new directory and file
- Phase 2's edit button will 404 if Phase 3 is reverted alone — revert both phases together if needed

## Next Steps
- After all three phases ship: smoke-test the full flow (list page → product edit page → variant edit page → save → back to product edit page)
- Update `docs/development-roadmap.md` and `docs/project-changelog.md` to reflect the new variant edit capability
- Consider follow-up: variant create page (currently variants are added inline in `ProductVariantsTable` add row)

## Unresolved Questions
- Confirm exact toast library used by the project (likely `sonner` or `react-hot-toast` — check product edit page imports)
- Confirm exact `ImageUploader` import path and prop signature (read from `product-variants-table.tsx` to be sure)
- Confirm status enum values are `1`/`2` (numeric) vs string literals — verify against `ProductInfoPanel`
- Should Cancel use `router.back()` or always redirect to `/admin/products/{id}`? (recommend the latter for predictability)
