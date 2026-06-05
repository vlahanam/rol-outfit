# Phase 2: Backend Controller Updates

**Status:** completed  
**Effort:** 1h  
**Priority:** high  
**Depends on:** Phase 1

## Overview

Update public endpoints to call `ToLocalized(lang)` before returning responses. Admin endpoints remain unchanged.

## Files to Modify

- `backend/src/internal/controllers/product_controller.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/controllers/tag_controller.go`
- `backend/src/internal/controllers/widget_controller.go`

## Key Pattern

```go
// Extract language from header (already imported: i18n package)
lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

// Convert DTO to localized response
return ctx.JSON(common.SuccessResponse(dto.ToLocalized(lang), nil, nil))
```

## Implementation Steps

### 1. Product Controller (`product_controller.go`)

**ListProducts** (~line 52-54):
```go
// Before:
result := make([]*dto.ProductDTO, 0, len(products))
for _, p := range products {
    result = append(result, dto.ToProductDTO(p))
}

// After:
lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
result := make([]*dto.LocalizedProductDTO, 0, len(products))
for _, p := range products {
    result = append(result, dto.ToProductDTO(p).ToLocalized(lang))
}
```

**GetProduct** (~line 62-95):
- Already extracts `lang` at line 64
- Change return to use `ToLocalized(lang)` instead of raw DTO

### 2. Category Controller (`category_controller.go`)

**ListCategories** (public endpoint):
- Add `lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))`
- Return `[]*LocalizedCategoryDTO`

**GetCategory** (public endpoint):
- Already extracts lang for error messages
- Use same lang for `ToLocalized(lang)`

### 3. Tag Controller (`tag_controller.go`)

**ListTags** (public endpoint):
- Add `lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))`
- Return `[]*LocalizedTagDTO`

### 4. Widget Controller (`widget_controller.go`)

**ListWidgets** (public endpoint):
- Add `lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))`
- Return `[]*LocalizedWidgetDTO`

## Admin Endpoints (NO CHANGES)

These endpoints must continue returning full DTOs with both languages:
- `AdminListProducts`
- `AdminGetProduct`
- `AdminCreateProduct`
- `AdminUpdateProduct`
- Similar admin endpoints for Category, Tag, Widget

## TODO

- [ ] Update ListProducts to return LocalizedProductDTO
- [ ] Update GetProduct to return LocalizedProductDTO
- [ ] Update ListCategories to return LocalizedCategoryDTO
- [ ] Update GetCategory to return LocalizedCategoryDTO
- [ ] Update ListTags to return LocalizedTagDTO
- [ ] Update ListWidgets to return LocalizedWidgetDTO
- [ ] Verify admin endpoints unchanged
- [ ] Run `go build ./...` to verify compilation

## Verification

```bash
cd backend && go build ./...
cd backend && go test ./src/internal/controllers/...
```
