# Admin Product Form + API Integration: Dynamic Attributes & Variant Management

**Date**: 2026-05-07 00:29
**Severity**: Medium
**Component**: Admin frontend (product add/edit), backend API (product variants)
**Status**: Resolved

## What Happened

Completed end-to-end wiring of admin product form to real API with dynamic attribute and variant management. Product add/edit pages now derive variant column structure from `attribute_names` at runtime, and the backend enforces strict validation that variant attributes match product specifications.

## The Brutal Truth

The add/edit product pages were hardcoded to assume `color`, `size`, and `sku` — exactly three variant fields, no flexibility. The API had no validation preventing a product variant from having arbitrary attribute keys that don't match the parent product's `attribute_names`. This created a data integrity risk: admins could submit variants with mismatched attributes and nothing would stop them. We need the UI and API to be in sync, or the form becomes a lie.

## Technical Details

**Backend changes:**

- `GET /api/v1/admin/products/:id` now returns product with all variants regardless of status (previously filtered to published-only)
- `CreateVariant` / `UpdateVariant` now validate that variant `attributes` keys exactly match `product.attribute_names`. Returns 400 with `error.variant_attributes_mismatch` on failure
- `productService.Update` / `Delete` switched to `FindProductByIDNoFilter` so admins can manage hidden products (status=2)
- UUID validation added to `UpdateProduct` / `DeleteProduct` controllers (was missing, inconsistent with other handlers)

**Frontend changes:**

- Add product page: replaced hardcoded `color`/`size`/`sku` fields with dynamic columns derived from `attribute_names`. Adding an attribute name cascades live to all variant rows
- Edit product page: full rewrite from mock data. Now loads from API and split into 3 sub-components (under 200-line limit each): `product-info-panel`, `product-attr-names-panel`, `product-variants-table`
- Form submission uses `Promise.allSettled` — if some variants fail, redirects to edit page instead of losing the created product

## Key Decisions Made

1. **No combined create-product-and-variants endpoint** — Two separate POST calls is simpler and less fragile than a mega-request
2. **Empty `attribute_names` = unconstrained schema** — A product with no attributes allows variants to have any attributes. Documented with UI warning
3. **Attribute rename does NOT auto-migrate variants** — Renaming an attribute from "color" to "colour" won't retroactively update existing variants. Logged warning in UI when changes detected

## Lessons Learned

- Dynamic schema validation at the API level catches mismatches before they corrupt data
- `Promise.allSettled` beats `Promise.all` when you want partial success without losing work
- Splitting large form pages into focused sub-components kept code maintainable without becoming a mess of props

## Next Steps

- Monitor variant creation for `error.variant_attributes_mismatch` in staging (indicates UX confusion)
- Consider adding attribute migration UI if attribute renaming becomes common
- Add audit logging to track variant attribute changes for inventory reconciliation

**Files modified:**
- `/backend/src/internal/handlers/products.go` — UUID validation, filter logic
- `/backend/src/internal/services/product_service.go` — Variant attribute validation
- `/frontend/src/app/[locale]/admin/products/add/page.tsx` — Dynamic attributes
- `/frontend/src/app/[locale]/admin/products/[id]/edit/page.tsx` — Full API integration
