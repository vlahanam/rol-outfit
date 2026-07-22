---
title: "E-commerce Features Batch Implementation"
description: "5 features: sold quantity display, related products, chat button, TipTap image upload, product reviews"
status: pending
priority: P1
effort: 16h
branch: develop
tags: [ecommerce, product, review, tiptap, settings]
created: 2026-07-07
---

# E-commerce Features Batch Implementation

## Overview

Implement 5 e-commerce features in priority order (simplest to most complex):

| Phase | Feature | Effort | Status |
|-------|---------|--------|--------|
| 1 | [Display Sold Quantity](./phase-01-display-sold-quantity.md) | 30m | complete |
| 2 | [Related Products Section](./phase-02-related-products.md) | 1h | complete |
| 3 | [Chat Button (Message Now)](./phase-03-chat-button.md) | 1.5h | complete |
| 4 | [TipTap Image Upload](./phase-04-tiptap-image-upload.md) | 2h | complete |
| 5 | [Product Review System](./phase-05-product-reviews.md) | 10h | complete |

## Dependencies

```
Phase 1 ─────┐
Phase 2 ─────┼── All independent, can parallelize phases 1-4
Phase 3 ─────┤
Phase 4 ─────┘
             │
Phase 5 ───── Depends on understanding patterns from 1-4
```

## File Ownership Matrix

| Phase | Backend Files | Frontend Files |
|-------|---------------|----------------|
| 1 | (none) | `frontend/app/[locale]/(main)/product/[id]/page.tsx` |
| 2 | (none) | `frontend/app/[locale]/(main)/product/[id]/page.tsx`, new component |
| 3 | `backend/src/internal/services/site_setting_service.go` | `frontend/app/admin/(protected)/settings/page.tsx`, product page |
| 4 | (none) | `frontend/components/admin/tiptap-editor.tsx` |
| 5 | New files in models/repos/services/controllers | New admin pages, product page section |

**Conflict Risk:** Phases 1, 2, 3 touch product detail page — sequence execution or merge carefully.

## Test Matrix

| Feature | Unit Tests | Integration Tests | E2E |
|---------|------------|-------------------|-----|
| Sold Quantity | N/A | N/A | Manual |
| Related Products | N/A | N/A | Manual |
| Chat Button | Go service test | API endpoint test | Manual |
| TipTap Image | N/A | N/A | Manual |
| Reviews | Go repo/service tests | API endpoint tests | Manual |

## Rollback Plan

- Phase 1-4: Git revert single commits, no data migration
- Phase 5: Migration `down.sql` provided, removes `product_reviews` table

## Success Criteria

- [x] Product detail page shows sold count next to stock
- [x] Related products section displays 4-8 products from same category
- [x] Chat button appears on product detail, links to admin-configured URL
- [x] TipTap editor allows image insertion via upload service
- [x] Users can submit reviews (if purchased), admins can moderate
