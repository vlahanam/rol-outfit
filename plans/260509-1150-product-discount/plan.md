---
title: "Product Discount Feature"
description: "Percent discount with time window at both product and variant level — DB migration, backend service/DTO, admin UI, user-facing display"
status: done
priority: P1
effort: 6h
branch: develop
tags: [backend, frontend, product, discount, pricing]
created: 2026-05-09
---

# Plan: Product Discount Feature

## Overview

Add `discount_percent` (0–100) + `discount_start_at` / `discount_end_at` to both `products` and `product_variants`. Effective price computed in backend DTO and exposed as `sale_price`. Admin sets discounts via product edit/add and variant edit forms. User-facing pages show sale price with strikethrough original.

## Goals

1. Product-level discount — applies as fallback to all its variants
2. Variant-level discount — overrides product discount for that variant
3. Time-windowed activation (nullable start/end — null = no constraint)
4. `sale_price` exposed in all product/variant DTOs (computed server-side)
5. Cart uses effective (discounted) price at time of add
6. Admin UI: discount percent + date range inputs in product and variant forms
7. User UI: sale badge, strikethrough original price

## Non-Goals (YAGNI)

- Coupon codes / promo codes (separate feature)
- Flat-amount discounts (% is sufficient for MVP)
- Bulk discount rules (e.g., "buy 3 get 10% off")
- Discount history / audit log

## Architecture

```
Effective price priority:
  variant.discount_percent > 0 AND active  →  variant.price × (1 - variant.discount_percent/100)
  product.discount_percent > 0 AND active  →  variant.price × (1 - product.discount_percent/100)  [fallback]
  else                                     →  original price (no discount)

"Active" = NOW() is within [start_at, end_at]
  start_at NULL  → no lower bound
  end_at NULL    → no upper bound
  discount_percent == 0 → never active regardless of dates
```

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Backend DB Migration](phase-01-db-migration.md) | 30m | done |
| 02 | [Backend Model + DTO](phase-02-backend-model-dto.md) | 1h | done |
| 03 | [Backend Request + Service + Cart](phase-03-backend-service.md) | 1.5h | done |
| 04 | [Frontend Types + ProductItem](phase-04-frontend-types-ui.md) | 45m | done |
| 05 | [Frontend Admin Forms](phase-05-frontend-admin.md) | 1.5h | done |
| 06 | [Frontend User Pages](phase-06-frontend-user.md) | 45m | done |

## Key Dependencies

- Phase 02 depends on Phase 01 (model needs DB columns)
- Phase 03 depends on Phase 02 (service uses updated model)
- Phase 04 independent (can start in parallel with 01-03)
- Phase 05 depends on Phase 04 (types must exist)
- Phase 06 depends on Phase 04 (types must exist)
