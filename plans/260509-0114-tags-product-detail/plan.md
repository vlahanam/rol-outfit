---
title: "Tags CRUD, Product-Tag Assignment & Product Detail Enhancement"
description: "Add tag management with time-window activation, max-3 tag assignment per product, and variant picker + tags + multi-image gallery on user product detail page"
status: completed
priority: P2
effort: 14h
branch: develop
tags: [backend, frontend, admin, tags, product-detail, variants]
created: 2026-05-09
---

# Plan: Tags + Product-Tag Assignment + Product Detail Enhancement

## Overview

Three feature streams delivered across five sequential phases. Backend foundations land first (tags table, product_tags junction, endpoints), followed by admin UI (CRUD page, sidebar entry, assignment panel on product edit), then user-facing enhancements (variant picker, tag badges, multi-image gallery on product detail page).

## Goals

1. Admins manage Tags (CRUD) with optional `start_at`/`end_at` activation window
2. Admins assign up to 3 Tags per Product via product edit page
3. Users see variant picker (color/size), active tag badges, and multi-image gallery on `/product/[id]`

## Non-Goals (YAGNI)

- Tag color/icon customization (only name + slug + window for now)
- Tag-based product filtering on shop page (separate feature)
- Multi-locale tag names (current admin is vi-only)
- Auto-deactivation cron (filtering by current time at query layer is sufficient)
- Product-level image table (variant.avatar + product.avatar gallery is enough for MVP)

## Phases

| # | Phase | Status | Effort | Files Owned |
|---|-------|--------|--------|-------------|
| 01 | [Backend: Tags CRUD](./phase-01-backend-tags.md) | completed | 3h | backend/database/migrations/000011_*, backend/src/internal/{models,repositories,services,controllers,dto,requests}/tag* + i18n locales + route.go (tags routes only) |
| 02 | [Backend: Product-Tags Junction](./phase-02-backend-product-tags.md) | completed | 2h | backend/database/migrations/000012_*, backend/src/internal/{models,repositories,services,controllers,dto,requests}/product_tag* + product_dto.go (admin shape only) + route.go (assignment route only) |
| 03 | [Admin UI: Tag CRUD Pages](./phase-03-admin-ui-tags.md) | completed | 3h | frontend/types/api.ts (tag types), frontend/lib/{api-resources,api,validations}.ts (tags + sidebar entry), frontend/app/admin/(protected)/tags/**, frontend/components/admin/AdminSidebar.tsx |
| 04 | [Admin UI: Product Tag Assignment](./phase-04-admin-product-tags-ui.md) | completed | 2h | frontend/components/admin/product-tags-panel.tsx (NEW), frontend/app/admin/(protected)/products/[id]/page.tsx (insert panel) |
| 05 | [User: Product Detail Enhancement](./phase-05-user-product-detail.md) | completed | 4h | frontend/app/[locale]/(main)/product/[id]/page.tsx (slim), frontend/components/product/{variant-picker,tag-badges,image-gallery}.tsx (NEW), frontend/types/api.ts (extend Product) |

## Dependency Graph

```
Phase 01 (tags table + endpoints)
    │
    ├──> Phase 02 (product_tags junction; depends on tags table existing)
    │       │
    │       └──> Phase 04 (admin assigns tags to products; depends on assignment API)
    │
    └──> Phase 03 (admin tag CRUD UI; depends on tag endpoints)

Phase 05 (user product detail) depends on:
    - Phase 02 (public product GET must return tags)
    - Existing variants endpoint (already shipped)
```

Phases 03 and 05 can run in parallel after Phase 02 lands. Phase 04 needs Phase 03 (tag list dropdown reuses tag types/api client).

## Cross-Cutting Concerns

### Data Flow (end-to-end)

```
Admin creates Tag
  → POST /api/v1/tags (admin)
  → tags row inserted with slug derived from name

Admin assigns Tags to Product
  → PUT /api/v1/products/:id/tags { tag_ids: [...] }
  → service validates count ≤ 3, all tags exist
  → product_tags rows replaced atomically (DELETE + INSERT in tx)

Public fetches Product
  → GET /api/v1/products/:id
  → response includes "tags": [{id,name,slug,start_at,end_at}]
  → service joins product_tags + tags WHERE active window covers NOW()

Public fetches Variants
  → GET /api/v1/products/:id/variants (already exists)
  → user picks attribute combo → resolves variant → cart uses variant.id as attr_id
```

### "Active" Tag Semantics

`active = (start_at IS NULL OR start_at ≤ NOW()) AND (end_at IS NULL OR end_at ≥ NOW())`

- Admin list shows ALL tags (including inactive) with status badge
- Public product GET returns only ACTIVE tags
- Admin assignment allows assigning inactive tags (they'll appear when window opens)

### Backwards Compatibility

- `Product` JSON shape gains `tags?: Tag[]` — clients that ignore unknown fields are unaffected
- No changes to existing variant or cart endpoints
- Admin product edit page receives a NEW panel (no removed fields)
- User product detail page is rewritten but URL is unchanged

### Migration Path

Migration `000011_create_tags.up.sql` creates `tags` table only.
Migration `000012_create_product_tags.up.sql` creates `product_tags` junction.
Both have matching `.down.sql` files using `DROP TABLE IF EXISTS`.
No data migration needed (new tables, empty initial state).

### Rollback Strategy

| Phase | Rollback |
|-------|----------|
| 01 | Run `000011_*.down.sql`; remove tag routes in `route.go`; revert tag files |
| 02 | Run `000012_*.down.sql`; remove product-tags routes; revert tags from product GET response |
| 03 | Remove `/admin/tags` directory; revert sidebar entry; remove tag api-resources |
| 04 | Revert product-tags-panel; remove `<ProductTagsPanel>` insertion in product detail page |
| 05 | `git revert` the product detail page rewrite (only touches one route, no data) |

Each phase is a single PR; rollback = revert that PR.

### Test Matrix (Manual Verification — No Test Files Per Constraint)

| Layer | What to verify |
|-------|----------------|
| Migrations | `make rebuild`, `\dt` in psql shows `tags`, `product_tags`; FKs present |
| Backend tags | curl POST/GET/PUT/DELETE; admin list returns inactive; public product hides inactive |
| Backend assign | PUT 4 tags → 400; PUT 3 tags → 200; PUT [] → clears; non-existent tag_id → 404 |
| Admin UI tags | Create/edit/delete; window picker accepts null start/end |
| Admin UI assign | Picker caps at 3; remove button works; reload shows persisted state |
| User detail | Color/size picker resolves variant; price updates; cart receives variant_id; tags show as badges |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Variant attribute matrix has gaps (color X size Y missing) | High | Medium | Phase 05 disables unavailable size buttons after color is picked; show "Hết hàng" if stock=0 |
| Product GET payload bloat from N+1 tag fetch | Medium | Low | Single JOIN query in repo (Phase 02); cap product list endpoint to NOT include tags (only detail does) |
| Admin assigns tag during update race condition | Low | Low | Wrap DELETE+INSERT in single tx (Phase 02 service) |
| Slug collision when two tags have same name | Medium | Medium | Phase 01 adds unique slug index; service returns 409 with i18n key `error.tag_slug_taken` |
| Time-window picker UX (datetime-local) | Medium | Low | Phase 03 uses native `<input type="datetime-local">`; submit converts to ISO via `new Date(v).toISOString()` |

### File Ownership (no overlap between parallel phases)

- Phase 01 owns all `tag*` files, the tags migration pair, and only the tags route block in `route.go`
- Phase 02 owns all `product_tag*` files, the junction migration pair, the assignment route block, and edits `product_dto.go` + `product_repo.go` + `product_service.go` (extend to populate tags)
- Phase 03 owns `frontend/app/admin/(protected)/tags/**` and the sidebar edit
- Phase 04 owns `product-tags-panel.tsx` (new) + a single insertion point in `app/admin/(protected)/products/[id]/page.tsx`
- Phase 05 owns `app/[locale]/(main)/product/[id]/page.tsx` and three new components under `components/product/`

Phases 03 and 05 do not touch the same files. Phase 04 inserts into the product edit page while Phase 03 is independent of it.

## Success Criteria

- [x] `make rebuild` succeeds; backend logs no migration errors
- [x] `curl /api/v1/admin/tags` (with admin JWT) lists tags with paging
- [x] Public `GET /products/:id` returns `tags: []` when none, otherwise active tags only
- [x] Admin product edit page allows selecting up to 3 tags; reload preserves choice
- [x] User product detail shows variant picker; selecting color+size updates displayed price
- [x] Cart add request includes correct `attr_id` (variant.id) when variants present
- [x] Active tag badges render near product name on user detail page
- [x] Multi-image gallery shows product.avatar + each variant.avatar (deduped)
- [x] No file exceeds 200 lines

## Unresolved Questions

- Should `product_tags` deletes cascade when a tag is soft-deleted? Plan assumes hard delete on tags (no `deleted_at` on tags) so FK cascade handles it. Confirm with user if soft delete is required for tags.
- Should the variant picker pre-select the cheapest in-stock variant on load, or require explicit user action? Plan defaults to NO pre-selection; price falls back to `product.default_price` until user picks.
- Is the product detail "tags" array order significant (admin-defined ordering)? Plan uses insertion order via `product_tags.created_at ASC`. If admin needs explicit reorder, add `position` column later.
