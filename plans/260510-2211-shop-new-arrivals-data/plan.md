---
title: "Shop & New Arrivals - Real Data"
description: "Connect /shop and /new-arrivals pages to real API data; add tag-slug filter to GET /products"
status: completed
priority: P1
effort: 2h
branch: develop
tags: [backend, frontend, products, tags]
created: 2026-05-10
---

# Shop & New Arrivals – Real Data

## Goal
- `/shop`: Already fetches from API — no changes needed.
- `/new-arrivals`: Replace hardcoded static data with real products tagged "NEW" from backend.
- Backend: Add `tag` (slug) query parameter to `GET /api/v1/products` to support tag-based filtering.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Backend – tag filter on ListProducts | completed | [phase-01-backend-tag-filter.md](phase-01-backend-tag-filter.md) |
| 2 | Frontend – new-arrivals real data | completed | [phase-02-frontend-new-arrivals.md](phase-02-frontend-new-arrivals.md) |

## Key Dependencies
- Phase 2 requires Phase 1 (needs `?tag=new` API support before frontend uses it).

## Files Changed
- `backend/src/internal/repositories/product_repo.go` — extend `ListProducts` with tag filter
- `backend/src/internal/services/product_service.go` — update `List()` signature
- `backend/src/internal/controllers/product_controller.go` — read `tag` query param
- `frontend/app/[locale]/(main)/new-arrivals/page.tsx` — replace static data with API call
