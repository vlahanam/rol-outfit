# Phase 4: Testing & Verification

**Status:** completed  
**Effort:** 30m  
**Priority:** high  
**Depends on:** Phases 1-3

## Overview

Verify all 4 entities display correctly in both languages and fallback works.

## Test Matrix

| Entity | VN URL | JP URL | Fallback (no JA) |
|--------|--------|--------|------------------|
| Products | `/vn/products` → Vietnamese | `/jp/products` → Japanese | Vietnamese |
| Categories | `/vn/categories` → Vietnamese | `/jp/categories` → Japanese | Vietnamese |
| Tags | Tag names on products | Tag names on products | Vietnamese |
| Widgets | Homepage widgets | Homepage widgets | Vietnamese |

## Manual Testing Steps

### 1. Start Dev Environment

```bash
make up
```

### 2. Test Products

1. Go to `http://localhost/vn/products`
2. Verify product names/descriptions in Vietnamese
3. Click language switcher → Japanese
4. URL changes to `/jp/products`
5. Verify product names/descriptions in Japanese
6. Open DevTools → Network → Check `Accept-Language: ja` header

### 3. Test Categories

1. Go to `http://localhost/vn/categories`
2. Verify category names in Vietnamese
3. Switch to Japanese
4. Verify category names in Japanese

### 4. Test Tags

1. View product detail page
2. Check tag names change with language

### 5. Test Widgets

1. Go to homepage
2. Check widget names in Vietnamese
3. Switch language
4. Check widget names update

### 6. Test Fallback

1. Find a product without Japanese translation
2. Switch to Japanese
3. Verify it shows Vietnamese (fallback)

### 7. Test Admin (No Regression)

1. Go to `/admin/products`
2. Verify both Vietnamese AND Japanese fields visible
3. Edit a product
4. Verify both language inputs work

## Automated Tests (Optional)

Add backend test for DTO localization:

```go
func TestProductDTO_ToLocalized(t *testing.T) {
    dto := &ProductDTO{
        Name:        "Áo thun",
        NameJa:      "Tシャツ",
        Description: "Mô tả VN",
        DescriptionJa: "説明 JP",
    }
    
    // Test Japanese
    ja := dto.ToLocalized("ja")
    assert.Equal(t, "Tシャツ", ja.Name)
    assert.Equal(t, "説明 JP", ja.Description)
    
    // Test Vietnamese
    vi := dto.ToLocalized("vi")
    assert.Equal(t, "Áo thun", vi.Name)
    
    // Test fallback (empty Japanese)
    dto.NameJa = ""
    ja = dto.ToLocalized("ja")
    assert.Equal(t, "Áo thun", ja.Name) // Falls back to Vietnamese
}
```

## TODO

- [ ] Test Products in both languages
- [ ] Test Categories in both languages
- [ ] Test Tags in both languages
- [ ] Test Widgets in both languages
- [ ] Test fallback when Japanese empty
- [ ] Test admin endpoints unchanged
- [ ] Verify Network requests have correct Accept-Language

## Success Criteria

All boxes checked = bug fixed.
