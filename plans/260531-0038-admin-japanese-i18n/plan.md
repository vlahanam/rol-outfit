---
title: Admin Japanese Input for i18n
status: complete
priority: high
created: 2026-05-31
blockedBy: []
blocks: []
planDir: plans/260531-0038-admin-japanese-i18n
---

# Admin Japanese Input for i18n

Thêm input tiếng Nhật trong admin pages để hỗ trợ đa ngôn ngữ (Việt + Nhật).

## Context

- **Brainstorm:** `plans/reports/brainstorm-260531-0038-admin-japanese-input-i18n.md`
- **Branch:** develop

## Scope

| Entity | Fields to Add |
|--------|---------------|
| Products | name_ja, description_ja |
| Product Variants | name (NEW), name_ja (NEW) |
| Categories | name_ja, description_ja |
| Tags | name_ja |
| Widgets | name_ja |

## Design Decisions

- **DB Strategy:** Column suffix (_ja)
- **Required:** Vietnamese mandatory, Japanese optional
- **UI:** Tab switching [VI] [JA]
- **API:** Localized response based on Accept-Language
- **Fallback:** Japanese empty → return Vietnamese
- **Slug:** Keep Vietnamese only, no slug_ja

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend Migration](phase-01-backend-migration.md) | done | 30m |
| 2 | [Backend Models & DTOs](phase-02-backend-models-dtos.md) | done | 1h |
| 3 | [Backend i18n Helper](phase-03-backend-i18n-helper.md) | done | 30m |
| 4 | [Frontend LanguageTabs Component](phase-04-frontend-language-tabs.md) | done | 1h |
| 5 | [Frontend Admin Forms](phase-05-frontend-admin-forms.md) | done | 2h |

**Total Effort:** ~5h

## Files Changed

**Backend (14 files):**
- `database/migrations/000X_add_i18n_columns.sql` (new)
- `internal/models/product.go`
- `internal/models/product_variant.go`
- `internal/models/category.go`
- `internal/models/tag.go`
- `internal/models/widget.go`
- `internal/dto/product_dto.go`
- `internal/dto/category_dto.go`
- `internal/dto/tag_dto.go`
- `internal/dto/widget_dto.go`
- `internal/requests/product_request.go`
- `internal/requests/category_request.go`
- `internal/requests/tag_request.go`
- `internal/utils/i18n_helper.go` (new)

**Frontend (12 files):**
- `components/admin/language-tabs-form.tsx` (new)
- `app/admin/(protected)/products/add/page.tsx`
- `app/admin/(protected)/products/[id]/edit/page.tsx`
- `app/admin/(protected)/products/[id]/variants/add/page.tsx`
- `app/admin/(protected)/products/[id]/variants/[variantId]/edit/page.tsx`
- `app/admin/(protected)/categories/add/page.tsx`
- `app/admin/(protected)/categories/[id]/edit/page.tsx`
- `app/admin/(protected)/tags/add/page.tsx`
- `app/admin/(protected)/tags/[id]/edit/page.tsx`
- `app/admin/(protected)/widgets/[id]/page.tsx`
- `types/api.ts`
- `lib/validations.ts`

## Success Criteria

- [x] Admin can input Japanese text for all specified fields
- [x] Tab UI [VI] [JA] switches smoothly in all forms
- [x] Vietnamese validation enforced, Japanese optional
- [ ] Public API returns localized content based on Accept-Language (deferred - helper created)
- [x] Fallback to Vietnamese when Japanese empty (helper ready)
- [x] Existing data unaffected after migration
