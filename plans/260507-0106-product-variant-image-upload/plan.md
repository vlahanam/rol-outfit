---
title: Product & Variant Image Upload
status: completed
priority: high
created: 2026-05-07
completedDate: 2026-05-07
blockedBy: []
blocks: []
---

# Product & Variant Image Upload

Add image upload UI to the admin product add/edit pages. Product avatar is **required**; variant avatar is **optional**.

## Current State

| Layer | What exists | What's missing |
|-------|------------|----------------|
| Backend | `POST /api/v1/uploads` + `DELETE /api/v1/uploads/:filename` working; `avatar TEXT` on both `products` and `product_variants` | `avatar` not validated as required on `CreateProductRequest` |
| Frontend | `api.ts` has no upload helper; admin add/edit pages have no image UI | Upload helper, `ImageUploader` component, avatar fields in all 4 forms |

## Scope

| Layer | Change |
|-------|--------|
| Backend | Add `Required` validation on `CreateProductRequest.Avatar` + i18n key |
| Frontend API | Add `uploads.upload(file)` to `lib/api.ts` |
| Frontend component | Create reusable `ImageUploader` component |
| Frontend add page | Product avatar (required) + per-variant avatar (optional) |
| Frontend edit page | Product avatar display/replace in `ProductInfoPanel`; variant avatar in `ProductVariantsTable` |

## Phases

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend – Avatar Required Validation](./phase-01-backend-avatar-validation.md) | completed | 10 min |
| 2 | [Frontend – Upload API Helper + ImageUploader Component](./phase-02-frontend-upload-component.md) | completed | 20 min |
| 3 | [Frontend – Add Product Page](./phase-03-frontend-add-page.md) | completed | 30 min |
| 4 | [Frontend – Edit Product Page](./phase-04-frontend-edit-page.md) | completed | 30 min |

## Key Design Decisions

- **Upload-then-reference**: UI calls `POST /api/v1/uploads` immediately on file select → gets URL → stores URL in state → submits URL with product/variant form. No base64 or deferred upload.
- **Old file deletion**: When replacing an existing image, the old file is deleted via `DELETE /api/v1/uploads/:filename` before or after the new one is set. Best-effort — not transactional.
- **Required at product create**: Backend validates `avatar` is non-empty on `CreateProductRequest`. Frontend also enforces it before submit.
- **Variant avatar**: Optional in both frontend and backend (no validation change needed for variants).
- **Reusable component**: Single `ImageUploader` component handles preview, upload trigger, remove — used in all 4 places.
