---
title: Admin Product Form + API Integration
status: completed
priority: high
created: 2026-05-07
completed: 2026-05-07
blockedBy: []
blocks: []
---

# Admin Product Form + API Integration

Wire up the admin add/edit product pages to the real API, fix hardcoded variant fields, and enforce attribute consistency.

## Problem Summary

1. **Add product page** (`/admin/products/add`) – form is dead (only `console.log`), variant fields are hardcoded to `color`/`size`, and `sku` field doesn't exist in the backend schema.
2. **Edit product page** (`/admin/products/[id]`) – fully mocked, no API calls, no variant CRUD.
3. **No admin single-product endpoint** – `GET /api/v1/admin/products/:id` is missing; existing `GET /api/v1/products/:id` is public-only and filters by `status=active`.
4. **No attribute consistency enforcement** – backend allows creating a variant with arbitrary keys, ignoring `product.attribute_names`.

## Scope

| Layer | Change |
|-------|--------|
| Backend | Add admin get-product-by-ID endpoint + variant attribute validation |
| Frontend types | Add payload types |
| Frontend API lib | Add `adminProducts.get/create/update/createVariant/updateVariant` |
| Frontend add page | Redesign with dynamic attribute fields, wire to API |
| Frontend edit page | Full rewrite with API integration and variant CRUD |

## Phases

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend – Admin Product Detail Endpoint](./phase-01-backend-admin-get-product.md) | completed | 20 min |
| 2 | [Backend – Variant Attribute Validation](./phase-02-backend-variant-attribute-validation.md) | completed | 20 min |
| 3 | [Frontend – Types & API Layer](./phase-03-frontend-api-types.md) | completed | 15 min |
| 4 | [Frontend – Add Product Page](./phase-04-frontend-add-product-page.md) | completed | 45 min |
| 5 | [Frontend – Edit Product Page](./phase-05-frontend-edit-product-page.md) | completed | 45 min |

## Key Design Decisions

- **Attribute names** are the variant attribute KEYS (e.g., `["Size","Color"]`). They live on the product. Each variant provides a value per key.
- **No combined create-product-and-variants endpoint** (YAGNI). Frontend posts product first, gets ID, then posts variants.
- **SKU field removed** from frontend variant form – it has no backing column in `product_variants`.
- **Dynamic variant form**: when admin adds/removes an attribute name, all variant rows update live.
- **Edit page** replaces the placeholder; inline editing pattern kept for basic info.
