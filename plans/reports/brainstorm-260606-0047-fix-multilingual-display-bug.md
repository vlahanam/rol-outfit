# Brainstorm: Fix Multilingual Display Bug

**Date:** 2026-06-06
**Status:** Approved
**Approach:** DTO-level localization (Approach A)

## Problem Statement

Multilingual content saved via Admin panel does not display correctly on User/Frontend side when switching languages. URL locale changes (`/vn/*` ↔ `/jp/*`) but API responses show default Vietnamese.

### Root Causes Identified

1. **Frontend**: `Accept-Language: "vi"` hardcoded in `api-client.ts:86` and `api.ts:63`
2. **Backend**: DTOs return ALL fields (`name` + `name_ja`) — no localization applied
3. **Gap**: `GetLocalizedString()` helper exists but only used for error messages

## Solution Design

### Frontend Changes

**Files to modify:**
- `frontend/lib/api-client.ts`
- `frontend/lib/api.ts`

**Change:**
Replace hardcoded `"Accept-Language": "vi"` with dynamic header based on current locale.

```typescript
// Mapping: URL locale → Accept-Language value
const localeToLang: Record<string, string> = {
  vn: "vi",
  jp: "ja",
};
```

API functions must accept locale parameter and set header accordingly.

### Backend Changes

**Files to modify:**
- `backend/src/internal/dto/product_dto.go`
- `backend/src/internal/dto/category_dto.go`
- `backend/src/internal/dto/tag_dto.go`
- `backend/src/internal/dto/widget_dto.go`
- `backend/src/internal/controllers/product_controller.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/controllers/tag_controller.go`
- `backend/src/internal/controllers/widget_controller.go`

**Pattern:**
1. Add `ToLocalizedResponse(lang string)` method to each DTO
2. Uses existing `utils.GetLocalizedString()` helper for fallback logic
3. Public controllers call `ToLocalizedResponse(lang)` before returning
4. Admin controllers continue returning full DTO (both languages)

### DTO Localization Pattern

```go
// ProductDTO example
func (p *ProductDTO) ToLocalizedResponse(lang string) *LocalizedProductDTO {
    return &LocalizedProductDTO{
        ID:          p.ID,
        Name:        utils.GetLocalizedString(p.Name, p.NameJa, lang),
        Description: utils.GetLocalizedString(p.Description, p.DescriptionJa, lang),
        // ... other non-localized fields
    }
}
```

### Controller Pattern

```go
// Public endpoint
func (c *ProductController) GetProduct(ctx fiber.Ctx) error {
    lang := i18n.LangFromHeader(ctx)
    product := service.GetProduct(id)
    return ctx.JSON(product.ToLocalizedResponse(lang))
}

// Admin endpoint (unchanged)
func (c *ProductController) AdminGetProduct(ctx fiber.Ctx) error {
    product := service.GetProduct(id)
    return ctx.JSON(product) // Full DTO with all translations
}
```

## Affected Entities

| Entity | Fields to Localize |
|--------|-------------------|
| Product | `name`, `description` |
| Category | `name`, `description` |
| Tag | `name` |
| Widget | `name` |

## Implementation Order

1. **Backend DTOs**: Add localized response structs and methods
2. **Backend Controllers**: Update public endpoints to use localized responses
3. **Frontend API**: Pass dynamic locale to Accept-Language header
4. **Testing**: Verify all 4 entities switch language correctly

## Success Criteria

- [ ] Language switcher on frontend updates API calls with correct `Accept-Language`
- [ ] Products display in selected language
- [ ] Categories display in selected language
- [ ] Tags display in selected language
- [ ] Widgets display in selected language
- [ ] Japanese fallback to Vietnamese when translation empty
- [ ] Admin endpoints unchanged (return all fields)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking admin functionality | Admin endpoints remain unchanged, only public routes affected |
| Missing translations | `GetLocalizedString()` already handles fallback to Vietnamese |
| API contract change | Frontend already expects single `name` field, just wasn't getting localized value |

## Estimated Effort

- Backend: ~2-3 hours (DTOs + controllers)
- Frontend: ~1 hour (API headers)
- Testing: ~1 hour

**Total:** ~4-5 hours

## Next Steps

1. Create implementation plan with phase files
2. Implement backend DTO changes first
3. Update controllers
4. Fix frontend API headers
5. Test end-to-end
