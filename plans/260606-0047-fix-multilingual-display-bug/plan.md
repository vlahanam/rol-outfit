---
title: Fix Multilingual Display Bug
status: completed
priority: high
created: 2026-06-06
blockedBy: []
blocks: []
planDir: plans/260606-0047-fix-multilingual-display-bug
---

# Fix Multilingual Display Bug

Fix frontend language switcher to update API calls with correct locale, and backend to return localized content.

## Context

- **Brainstorm:** `plans/reports/brainstorm-260606-0047-fix-multilingual-display-bug.md`
- **Related:** `plans/260531-0038-admin-japanese-i18n/plan.md` (completed - added i18n fields)
- **Branch:** develop

## Root Causes

1. **Frontend**: `Accept-Language: "vi"` hardcoded in `api-client.ts:86` and `api.ts:63`
2. **Backend**: DTOs return ALL fields (`name` + `name_ja`) — no localization applied
3. **Gap**: `GetLocalizedString()` helper exists but only used for error messages

## Design Decisions

- **Locale mapping:** `/vn/*` → `vi`, `/jp/*` → `ja`
- **Response strategy:** Single localized field (not both)
- **Backend layer:** DTO-level with `ToLocalized(lang)` methods
- **Admin unchanged:** Admin endpoints return full DTO (both languages)

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend DTO Localization](phase-01-backend-dto-localization.md) | completed | 1h |
| 2 | [Backend Controller Updates](phase-02-backend-controller-updates.md) | completed | 1h |
| 3 | [Frontend API Headers](phase-03-frontend-api-headers.md) | completed | 30m |
| 4 | [Testing & Verification](phase-04-testing-verification.md) | completed | 30m |

**Total Effort:** ~3h

## Files Changed

**Backend (8 files):**
- `internal/dto/product_dto.go` - Add LocalizedProductDTO + ToLocalized()
- `internal/dto/category_dto.go` - Add LocalizedCategoryDTO + ToLocalized()
- `internal/dto/tag_dto.go` - Add LocalizedTagDTO + ToLocalized()
- `internal/dto/widget_dto.go` - Add LocalizedWidgetDTO + ToLocalized()
- `internal/controllers/product_controller.go` - Use ToLocalized() in public endpoints
- `internal/controllers/category_controller.go` - Use ToLocalized() in public endpoints
- `internal/controllers/tag_controller.go` - Use ToLocalized() in public endpoints
- `internal/controllers/widget_controller.go` - Use ToLocalized() in public endpoints

**Frontend (2 files):**
- `lib/api-client.ts` - Dynamic Accept-Language header
- `lib/api.ts` - Dynamic Accept-Language header

## Success Criteria

- [x] Language switcher updates API calls with correct Accept-Language
- [x] Products display in selected language
- [x] Categories display in selected language
- [x] Tags display in selected language
- [x] Widgets display in selected language
- [x] Japanese fallback to Vietnamese when translation empty
- [x] Admin endpoints unchanged (return all fields)
