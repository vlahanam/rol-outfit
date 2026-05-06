---
title: Code Review — Variant Edit + List Image Display
reviewer: code-reviewer
date: 2026-05-07
plan: 260507-0134-variant-edit-list-images
---

# Code Review: Variant Edit + List Image Display

## Scope
- `frontend/app/admin/(protected)/products/page.tsx` (modified, ~364 lines)
- `frontend/components/admin/product-list-variants-table.tsx` (new, 111 lines)
- `frontend/components/admin/product-variants-table.tsx` (modified, 291 lines)
- `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx` (new, 191 lines)
- All files within 200-line constraint. TypeScript confirmed passing.

## Overall Assessment

Solid implementation. The routing structure, data flow, and error states are all correct. The checklist items raised in the brief are addressed accurately below. Two medium issues found: one real DRY violation and one silent invalid-input bug. No blocking security, auth, or data-loss issues.

---

## Critical Issues

None.

---

## High Priority

### 1. `Number("")` passes price/stock validation — sends `0` silently

**File:** `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx` lines 49–53

`Number("") === 0`, which is not `NaN` and is `>= 0`, so an empty price or stock field passes validation and submits `0` to the backend. This is almost certainly unintended — a user who clears the price field and saves ends up with a ₫0 variant.

```typescript
// Current — passes when field is empty
if (Number.isNaN(priceNum) || priceNum < 0) errors.price = "Giá không hợp lệ";

// Fix — reject empty string explicitly
if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0)
  errors.price = "Giá không hợp lệ";
if (!stock.trim() || !Number.isInteger(stockNum) || stockNum < 0)
  errors.stock = "Tồn kho không hợp lệ";
```

---

## Medium Priority

### 2. `stockBadge` and `VariantAvatarCell` duplicated across three files (DRY violation)

Both helpers are copy-pasted identically in:
- `product-list-variants-table.tsx`
- `product-variants-table.tsx`

(`stockBadge` also exists in `products/page.tsx` but serves the product row there, not variant rows, so that instance is acceptable.)

The two variant table files should import from a shared location, e.g. `frontend/components/admin/variant-shared.tsx` (or `variant-utils.ts` for the badge + a shared cell component). This is a DRY concern only — the duplication doesn't cause a bug today, but a future badge-logic change will require edits in two places.

### 3. `variant` state is set but its only render use is the guard check on line 81

**File:** `[variantId]/page.tsx` line 16, 36, 81

`setVariant(v)` stores the full `ProductVariant` object, but the page form is driven entirely by the individual state variables (`attributes`, `price`, `stock`, etc.). The `variant` state is referenced only in the `if (loadError || !product || !variant)` guard at line 81.

This is not a bug — the guard is legitimate and meaningful (it blocks render until data is confirmed found). The state is not "unused" in the harmful sense; it's a loaded-but-not-directly-rendered guard. However, if the intent was to also use `variant` elsewhere (e.g. display a "last updated" date or show a read-only SKU summary), that data is available.

If the guard is the only purpose, `variant` could be replaced with a boolean `variantFound` flag to make the intent explicit. Non-blocking — current code is correct.

---

## Low Priority

### 4. `colSpan={7}` hardcoded in list page product row

**File:** `products/page.tsx` line 328

The table has 7 columns (hardcoded `colSpan={7}` on the variants expansion row). If a column is ever added or removed from the main table, this silently misaligns. Consider extracting a `COLUMN_COUNT` constant, or accepting that it will be caught visually. Trivial fix but easy to forget.

### 5. Edit button icon inconsistency: `Edit` vs `Pencil` across tables

`product-list-variants-table.tsx` uses `Edit` icon; `product-variants-table.tsx` uses `Pencil`. Both from lucide-react, both represent edit. Cosmetically inconsistent but functionally fine.

---

## Checklist Answers (from brief)

**1. Type safety — `useParams` and `attributes` type assertion**
`useParams<{ id: string; variantId: string }>()` is the standard pattern used across the codebase (confirmed in orders, users, products pages). TypeScript passes. The `attributes` field on `ProductVariant` is typed as `Record<string, string>` in `api.ts` — no unsafe assertion needed. `v.attributes ?? {}` is the correct fallback.

**2. Edge cases — missing variant, product fetch error**
Both are handled correctly. If `api.adminProducts.get(id)` rejects, `loadError` is set and the error UI renders with a back link. If the product loads but no variant matches `variantId`, `setLoadError("Không tìm thấy biến thể")` is called and the same error UI renders. The `!product || !variant` guard in the render path is a correct safety net.

**3. `variant` state set but not used directly in render**
Addressed in Medium #3 above. Correct as a guard; not a bug.

**4. Delete flow: `onDeleteVariant` prop → `setDeleteVariant({ productId, variantId })`**
Confirmed correct. `ProductListVariantsTable` calls `onDeleteVariant(variant.id)` which maps to the parent's `(variantId) => setDeleteVariant({ productId: product.id, variantId })` — `productId` comes from the closed-over `product.id` in the parent's row render. The `handleDeleteVariant` in the parent correctly destructures both. Flow is correct.

**5. Accessibility / UX**
- Expand toggle button on rows with no variants has `disabled={!hasVariants}` but still renders a clickable-looking `<span>` placeholder — fine, it's disabled.
- Edit/delete buttons have `title` attributes (tooltips) — good.
- No `aria-label` on the `VariantAvatarCell` image; `alt="variant"` is generic. Low impact for an admin-only page.
- The `ArrowLeft` back link in the edit page uses a `<Link>` wrapping an icon with no visible text — should have `aria-label="Quay lại sản phẩm"` for screen readers. Informational.

**6. TypeScript passes — confirmed by brief**
Pre-existing `carts/page.tsx` error is unrelated to this diff.

---

## Security / Auth

- Variant DELETE from list page uses `api.delete('/products/${productId}/variants/${variantId}')`. The backend route at `DELETE /api/v1/products/:productID/variants/:id` is protected by `JWTAuth + RequireRole(ADMIN)` middleware. The `request()` function sends the `Authorization` header from localStorage when a token is present. No auth bypass.
- No PII or secrets exposed in new files.
- No user-controlled values interpolated into anything other than API paths (which go to the backend, not DOM).

---

## Positive Observations

- `useEffect` cleanup is not needed here (single fetch, no subscriptions) — correct not to add it.
- Inline field error clearing on change (`setFieldErrors((p) => { const n = {...p}; delete n[name]; return n; })`) is clean UX.
- `Cancel` uses explicit `href` not `router.back()` — correct choice; avoids sending the user to an unexpected previous page.
- `unoptimized` prop consistently applied to all `/uploads/` images across all four files.
- `product.attribute_names ?? []` defensive fallback in `product-variants-table.tsx` line 46 — good defensive coding.
- Error states are surfaced inline, not swallowed silently.

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| High | Fix empty-string passthrough in price/stock validation (add `.trim()` check before `Number()`) |
| Medium | Extract `stockBadge` + `VariantAvatarCell` into a shared file to remove duplication |
| Low | Add `aria-label` to the `ArrowLeft` back-link in edit variant page |
| Low | Consider replacing `variant` state with a `variantFound: boolean` if the full object is never needed beyond the guard |

---

## Unresolved Questions

- Is `price = 0` a valid business state (e.g. gift/free variant)? If not, add `priceNum === 0` to the validation rejection. Confirm with product owner.
- The `status` dropdown in the edit page offers values `1` ("Hiển thị") and `2` ("Ẩn"). The `ProductVariant` type has `status: number` but no constants are defined. Confirm `1`/`2` match backend enum — no shared constant exists in the frontend codebase for variant status values.
