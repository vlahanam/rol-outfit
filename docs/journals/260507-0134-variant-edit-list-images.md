# Variant Edit Form & List Images Implementation

**Date**: 2026-05-07
**Severity**: Low
**Component**: Admin variant management, product table
**Status**: Resolved

## What Happened

Completed 3-phase implementation for variant edit workflow: extracted variant table into reusable component, added edit button routing, and built full variant edit form with image upload and attribute management. Added "Ảnh" (image) column to product list to show variant avatars.

## The Brutal Truth

Empty string validation nearly broke the whole form. When a user cleared the price field, `Number("") === 0` silently passed the `>= 0` check, storing zero instead of erroring. Caught it during manual testing after 20+ minutes of confusion — the fix is simple (`.trim()` check before conversion) but painfully obvious in hindsight. Also, the plan pseudocode used `toast.error()` but we don't have a toast library. Had to adapt to match existing error state patterns in the admin pages, which meant reading the product form implementation to match conventions.

## Technical Details

**Validation issue:** `Number("")` returns `0`, which passes `>= 0`. Fixed with:
```javascript
if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0)
```

**Image handling:** Next.js Image `unoptimized` required for Nginx-served `/uploads/` paths (optimizer runs in frontend container, can't reach port 80).

**Component extraction:** Split `products/page.tsx` inline table into `product-list-variants-table.tsx` — added avatar display in new Ảnh column, edit button routes to `/admin/products/${product.id}/variants/${v.id}`.

**Edit form:** 191-line variant edit page with ImageUploader, dynamic attribute inputs populated from `product.attribute_names`, price/stock/status fields, inline field error tracking. Single API call fetches product (includes all variants) — found target variant by `variantId` in the returned array.

**Data types:** IDs are UUID strings, not integers. Plan pseudocode would have broken with `Number(params.id)` — kept as strings throughout.

## Root Cause Analysis

Empty string validation oversight came from not testing edge cases (user clears field → blur) before merging. Plan referenced a toast library that doesn't exist in the project — should have audited existing patterns first. Had to read the admin product form implementation mid-work to match error handling conventions.

## Lessons Learned

1. Number validation: always check `.trim()` and `isNaN()` before arithmetic. `Number("")` is a silent footgun.
2. Before adapting plan pseudocode, audit the project for existing patterns (error handling, UI components, state management). Don't assume the plan matches the codebase.
3. UUID strings throughout — no conversion to/from numbers. Keep type consistency end-to-end.
4. Single API call with filtering in array is YAGNI enough — no need for separate `getVariant` helper when parent product includes all variants.

## Next Steps

- Add validation tests for form field edge cases (empty strings, negative numbers, invalid UUIDs)
- Consider adding a shared validation utility for number fields to prevent this pattern elsewhere
- Document variant edit flow in system architecture

**Commit:** TBD (awaiting merge)

