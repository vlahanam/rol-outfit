# Code Review: Admin Product Form + API Integration

**Date:** 2026-05-07
**Branch:** develop (commit 89fc458)
**Reviewer:** code-reviewer agent

---

## Scope

- **Backend:** product_repo.go, product_service.go, product_variant_service.go, product_controller.go, product_variant_controller.go, route.go, vi.json, ja.json
- **Frontend:** types/api.ts, lib/api.ts, lib/validations.ts, add/page.tsx, [id]/page.tsx, product-info-panel.tsx, product-attr-names-panel.tsx, product-variants-table.tsx
- **Build status:** Backend `go build ./...` clean; Frontend `npx tsc --noEmit` clean (1 pre-existing unrelated error)

---

## Overall Assessment

The feature is well-structured and follows existing patterns. Backend logic is sound. Two bugs require fixes before merging: a wrong API URL in the frontend client, and a silent delete failure in the variant table. Several medium-priority items are noted.

---

## Critical Issues

### 1. `adminProducts.create` and `adminProducts.update/remove` call non-admin URLs

**File:** `frontend/lib/api.ts` lines 140, 146, 152

```ts
// WRONG — hits /api/v1/products (admin-protected via middleware group but returns ProductDTO, not AdminProduct)
create(body): Promise<{ data: AdminProduct }> {
  return request<{ data: AdminProduct }>(`/products`, { ... });
}
update(id, body): Promise<void> {
  return request<void>(`/products/${id}`, { ... });
}
remove(id): Promise<void> {
  return request<void>(`/products/${id}`, { method: "DELETE" });
}
```

The list and get methods correctly use `/admin/products[/:id]`, which returns `ProductWithVariantsDTO` (shape matches `AdminProduct`). But create/update/remove hit `/products` and `/products/:id`, which return `ProductDTO` — missing `variants`, `total_stock`, `total_sold`, `variant_count`. The create call destructures `created.id` from the returned data, which works today (id is present in both DTOs), but the return type `{ data: AdminProduct }` is a lie that will cause silent type mismatches. The update/remove calls pass through middleware correctly since the same routes are admin-protected, but the semantic inconsistency is a bug waiting to happen.

**Fix:** Either:
- Use the same `/admin/products` prefix and add POST/PUT/DELETE to the admin product group in `route.go`, or
- Keep current routes but fix the TypeScript return types to `{ data: Product }` for create and document the inconsistency.

The cleaner fix is to register `POST /admin/products`, `PUT /admin/products/:id`, `DELETE /admin/products/:id` in the `adminProductsGroup` and update the client accordingly. This makes the admin API surface coherent.

---

## High Priority

### 2. Variant error index mismatch after removing a variant row (add page)

**File:** `frontend/app/admin/(protected)/products/add/page.tsx` lines 75–82

```ts
const removeVariant = (i: number) => {
  setVariants((prev) => prev.filter((_, idx) => idx !== i));
  setVariantErrors((prev) => {
    const next = { ...prev };
    delete next[i];   // only removes key i, does NOT shift i+1 → i, i+2 → i+1 ...
    return next;
  });
};
```

After removing variant at index 1 from [0,1,2], the array becomes [0,2] (indices 0,1 in new array). But `variantErrors` still has key `2` instead of key `1`. Validation errors from the old row 2 now display on new row 1. This is a display correctness bug — wrong errors shown, users confused.

**Fix:**
```ts
const removeVariant = (i: number) => {
  setVariants((prev) => prev.filter((_, idx) => idx !== i));
  setVariantErrors((prev) => {
    const next: Record<number, Record<string, string>> = {};
    Object.entries(prev).forEach(([key, val]) => {
      const k = Number(key);
      if (k < i) next[k] = val;
      else if (k > i) next[k - 1] = val;
      // k === i is dropped
    });
    return next;
  });
};
```

### 3. Partial product creation — product created, variants fail, user sees error but product exists

**File:** `frontend/app/admin/(protected)/products/add/page.tsx` lines 138–163

The submit handler creates the product first, then `Promise.all` for all variants. If any variant call fails, the catch block shows a generic error, but the product is already persisted. The user sees "Có lỗi xảy ra", cannot navigate away without leaving an orphaned product (no variants, possibly draft state).

The risk is low in development, but in production with concurrent users or transient network failures it produces orphaned products that only admins can find.

**Fix options (in priority order):**
1. After creating the product, use `Promise.allSettled` and navigate to the edit page for the created product ID, displaying which variants failed and letting the user retry them individually. This is the best UX.
2. Add a "rollback" soft-delete of the product if any variant fails, then re-throw.

Option 1 is already partially supported by the existing edit page (`[id]/page.tsx` + `ProductVariantsTable`).

### 4. Silent delete failure in `ProductVariantsTable`

**File:** `frontend/components/admin/product-variants-table.tsx` lines 76–86

```ts
const confirmDelete = async () => {
  if (!deleteId) return;
  try {
    await api.adminProducts.removeVariant(product.id, deleteId);
    onVariantDeleted(deleteId);
  } catch {
    // ignore        ← user sees modal close, variant disappears from UI only if success
  } finally {
    setDeleteId(null);
  }
};
```

`onVariantDeleted` is only called on success — that's correct. But if the API fails, the modal closes silently with no feedback. The user cannot tell whether the delete succeeded or failed. Add a state variable for delete error and display it.

**Fix:**
```ts
const [deleteError, setDeleteError] = useState<string | null>(null);

const confirmDelete = async () => {
  if (!deleteId) return;
  try {
    await api.adminProducts.removeVariant(product.id, deleteId);
    onVariantDeleted(deleteId);
    setDeleteId(null);
  } catch (err) {
    setDeleteError(err instanceof Error ? err.message : "Xóa thất bại");
  }
};
```

---

## Medium Priority

### 5. `validateAttributes` returns `ErrVariantAttributesMismatch` for malformed JSON

**File:** `backend/src/internal/services/product_variant_service.go` line 44

```go
if err := json.Unmarshal(raw, &attrs); err != nil {
    return ErrVariantAttributesMismatch
}
```

A JSON parse error (malformed payload) is semantically different from key-count mismatch. The caller at the controller layer (line 117, 168) catches this as `ErrVariantAttributesMismatch` and returns 400 with `error.variant_attributes_mismatch`. This is acceptable from a security standpoint (don't expose parse errors), but the i18n message "thuộc tính biến thể không khớp" is misleading for a malformed JSON body (which should already have been caught by `validateJSONObject` in `CreateVariantRequest.Validate()`). Since the request-level validation does catch bad JSON before the service is called, the only path where `json.Unmarshal` fails in `validateAttributes` is if the stored DB value is somehow invalid — in which case `ErrVariantAttributesMismatch` is incorrect semantically. Consider returning a wrapped error for observability.

### 6. `productService.Update` uses `FindProductByID` (active-only filter) for existence check

**File:** `backend/src/internal/services/product_service.go` line 100

```go
existing, err := s.repo.FindProductByID(ctx, id)  // WHERE status = 1 AND deleted_at IS NULL
```

Admin updating a hidden product (status=2) will receive 404 Not Found even though the product exists. `FindProductByIDNoFilter` should be used for the admin update path — the same way variant service uses it.

Similarly `productService.Delete` at line 147 uses `FindProductByID`, so deleting a hidden product fails with 404 instead of soft-deleting it. Since these are admin operations, both should use `FindProductByIDNoFilter`.

### 7. `ProductInfoPanel` — no client-side validation before save

**File:** `frontend/components/admin/product-info-panel.tsx` `handleSave`

The save sends whatever is in form state including potentially empty name or empty category_id. The backend validates and returns 400, which surfaces as an error message — so it's not broken. But the UX is jarring compared to the add page which validates locally first. Low severity but worth noting.

### 8. `ProductAttrNamesPanel` — `draft` state not reset on `handleCancel`

**File:** `frontend/components/admin/product-attr-names-panel.tsx` lines 55–58

```ts
const handleCancel = () => {
  setEditMode(false);
  setError(null);
  // draft is NOT reset to attrNames
};
```

`startEdit` does `setDraft([...attrNames])` correctly. But if the user opens edit, modifies draft, cancels, then re-opens — `startEdit` re-reads `attrNames` prop (line 25) so this is actually fine as-is. However, if `attrNames` prop has been updated (after a successful save) and the component re-renders with new props between edits, the stale draft is discarded on next `startEdit`. This is currently benign but the inconsistency is worth tracking.

---

## Low Priority

### 9. Missing UUID validation on `UpdateProduct` and `DeleteProduct` controllers

**File:** `backend/src/internal/controllers/product_controller.go`

`GetProduct` and `AdminGetProduct` validate `uuid.Parse(id)` before calling the service. `UpdateProduct` and `DeleteProduct` do not. Invalid UUIDs propagate to the DB query which handles them gracefully (no rows found → 404), but the early validation pattern is inconsistent and slightly less efficient.

### 10. `adminProducts.create` return type annotation incorrect

**File:** `frontend/lib/api.ts` line 139

`Promise<{ data: AdminProduct }>` — the POST /products endpoint returns `{ data: ProductDTO }`, not `ProductWithVariantsDTO`. The only field accessed is `created.id` (line 151 in add/page.tsx), which is present in both. Fix the annotation to `Promise<{ data: { id: string } }>` or the correct response type once the URL is fixed (Issue 1).

### 11. Hard delete for variants vs soft delete for products

**File:** `backend/src/internal/repositories/product_variant_repo.go` line 67

Variants are hard-deleted (`DELETE FROM product_variants WHERE id = ?`). Products are soft-deleted. If an order references a variant (by `attr_id` in `OrderItem`), deleting the variant orphans the order history. This may be an intentional design choice, but it should be documented. No foreign key constraint is visible in the GORM model.

---

## Positive Observations

- `validateAttributes` early-exits (no-op) when `attribute_names` is empty — correctly handles unconstrained products.
- `FindProductByIDAdmin` fetches product first, then variants separately — avoids GORM Preload complexity and keeps the query simple.
- `ListAdminProductsWithVariants` uses IN query for variants after fetching products — correct N+1 avoidance.
- `ProductVariantsTable` disables "Thêm biến thể" correctly when `attrNames` is empty (implicitly, since the form would have no attribute fields — actually the button is always enabled; the add form just renders no attribute inputs which is acceptable).
- i18n keys are consistent between vi.json and ja.json for all new entries.
- The `ProductAttrNamesPanel` displays an amber warning that changing attribute names does not auto-update existing variants — good UX transparency.
- TypeScript types for all new payloads are correctly nullable (`?`) on optional fields.
- `createVariantSchema` factory correctly generates per-attribute required validations dynamically.

---

## Recommended Actions (Prioritized)

1. **[Critical]** Fix API URLs in `lib/api.ts`: add `POST/PUT/DELETE` to `adminProductsGroup` in `route.go`, update client to `/admin/products[/:id]`.
2. **[High]** Fix `removeVariant` index shift bug in `add/page.tsx`.
3. **[High]** Handle partial variant creation failure in `handleSubmit`: use `Promise.allSettled`, navigate to product edit page on partial failure.
4. **[High]** Surface delete errors in `ProductVariantsTable.confirmDelete`.
5. **[Medium]** Use `FindProductByIDNoFilter` in `productService.Update` and `productService.Delete`.
6. **[Low]** Add UUID validation to `UpdateProduct` and `DeleteProduct` controllers for consistency.
7. **[Low]** Document or enforce soft-delete for variants if order history must be preserved.

---

## Unresolved Questions

- Is `DeleteVariant` intentionally a hard delete? If orders can reference `attr_id`, deleting variants may corrupt order history display.
- Should updating `attribute_names` on a product automatically validate or migrate existing variants? Currently the UI warns but does not enforce — the backend will accept variants with stale keys on the next update attempt.
- The `STATUS_LABEL` in `product-info-panel.tsx` maps `{ 1: "Hiển thị", 2: "Ẩn" }` while the backend constants are `PRODUCT_STATUS_ACTIVE=1, PRODUCT_STATUS_HIDDEN=2`. Is "Ẩn" (hidden) the intended second status, or should it map to the string "Ẩn" only in Vietnamese? Consistent with backend constants — this appears correct.

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Feature is functional and type-safe with clean compilation. Two high-priority frontend bugs (variant error index shift, silent delete failure) and one critical URL inconsistency in the API client require fixes before production deployment.
**Concerns:** The wrong API URL for create/update/remove (`/products` vs `/admin/products`) is the most impactful issue — it currently works because both route groups use the same underlying controller but the return type mismatch will silently break once the API response shapes diverge.
