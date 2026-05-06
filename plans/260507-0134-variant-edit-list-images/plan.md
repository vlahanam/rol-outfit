---
title: "Variant Edit + List Image Display"
description: "Add variant edit page, edit button on variants table, variant avatar column on list page, and unoptimized fix for product avatar"
status: completed
priority: P2
effort: 3h
branch: develop
tags: [frontend, admin, products, variants, ui]
created: 2026-05-07
completed: 2026-05-07
---

# Variant Edit + List Image Display

## Goal
Three connected UI improvements to admin product management:
1. Fix product avatar rendering on list page (Nginx-served `/uploads/` paths) and add variant avatar column to the inline variants sub-table.
2. Add edit button to `ProductVariantsTable` on product edit page.
3. Create dedicated variant edit page at `/admin/products/[id]/variants/[variantId]`.

No backend changes — all required APIs already exist.

## Phases

| # | Phase | File | Status | Effort |
|---|-------|------|--------|--------|
| 1 | List page: product avatar fix + extract variants sub-table + add avatar column | [phase-01-list-product-image.md](./phase-01-list-product-image.md) | completed | 1h |
| 2 | Add edit button to ProductVariantsTable | [phase-02-edit-button-variants-table.md](./phase-02-edit-button-variants-table.md) | completed | 0.5h |
| 3 | Create variant edit page | [phase-03-edit-variant-page.md](./phase-03-edit-variant-page.md) | completed | 1.5h |

## Dependencies
- Phase 1 — independent (can start immediately)
- Phase 2 — independent (can start in parallel with Phase 1)
- Phase 3 — depends on Phase 2 (edit button must route to a page that exists; develop in this order, but Phase 3 can be implemented first if Phase 2 placeholder is acceptable)

## File Ownership (no overlap)
- Phase 1 → `frontend/app/admin/(protected)/products/page.tsx`, `frontend/components/admin/product-list-variants-table.tsx` (new)
- Phase 2 → `frontend/components/admin/product-variants-table.tsx`
- Phase 3 → `frontend/app/admin/(protected)/products/[id]/variants/[variantId]/page.tsx` (new)

## Constraints
- Files under 200 lines (split when approaching limit)
- TypeScript types from `frontend/types/api.ts`
- Vietnamese UI labels
- `unoptimized` prop on every `<Image>` serving `/uploads/`
- YAGNI / KISS / DRY

## Success Criteria
- Product avatar visible on list page (no broken images)
- Variant avatar column visible on list page expanded sub-table
- Edit button visible next to delete button in variants table on product edit page
- Variant edit page loads existing variant data, allows editing attributes/price/stock/avatar/status, saves and redirects back
- All files compile without errors
- All files under 200 lines

## Rollback Plan
- Each phase is independently revertible (single-file changes or new-file creations)
- Revert via `git revert <commit>` per phase
- No DB migrations, no API contract changes
