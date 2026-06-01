# Brainstorm Report: Admin Japanese Input for i18n

**Date**: 2026-05-31
**Status**: Approved

---

## Problem Statement

Thêm input nhập tiếng Nhật trong admin để hỗ trợ đa ngôn ngữ (Việt + Nhật) cho content management.

**Scope**:
- Products: name, description, variant name
- Categories: name, description
- Tags: name
- Widgets: name

---

## Current State

| Component | i18n Status |
|-----------|-------------|
| Frontend UI (labels) | ✅ next-intl (vn/jp) |
| Backend errors | ✅ go-i18n (vi/ja) |
| DB content | ❌ Single language only |
| Admin forms | ❌ No multi-lang input |

---

## Chosen Solution: Column Suffix + Helper Fallback

### Database Changes

```sql
-- Products
ALTER TABLE products ADD COLUMN name_ja VARCHAR(255);
ALTER TABLE products ADD COLUMN description_ja TEXT;

-- Product Variants  
ALTER TABLE product_variants ADD COLUMN name_ja VARCHAR(255);

-- Categories
ALTER TABLE categories ADD COLUMN name_ja VARCHAR(255);
ALTER TABLE categories ADD COLUMN description_ja TEXT;

-- Tags
ALTER TABLE tags ADD COLUMN name_ja VARCHAR(255);

-- Widgets
ALTER TABLE widgets ADD COLUMN name_ja VARCHAR(255);
```

### Backend Helper Pattern

```go
// internal/utils/i18n_helper.go
func GetLocalizedField(defaultVal, jaVal, lang string) string {
    if lang == "ja" && jaVal != "" {
        return jaVal
    }
    return defaultVal
}
```

### API Response Strategy

- Admin APIs: Return ALL fields (name + name_ja)
- Public APIs: Return localized field based on Accept-Language header
- Fallback: Japanese empty → return Vietnamese

### Frontend Admin UI

**Tab Component**: Reusable `<LanguageTabsForm>` component

```
┌─────────────────────────────────────┐
│  [VI]  [JA]                         │
├─────────────────────────────────────┤
│  Tên sản phẩm *                     │
│  ┌───────────────────────────────┐  │
│  │ Áo dài truyền thống           │  │
│  └───────────────────────────────┘  │
│                                     │
│  Mô tả                              │
│  ┌───────────────────────────────┐  │
│  │ Áo dài Việt Nam...            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Khi chuyển tab [JA]:
```
┌─────────────────────────────────────┐
│  [VI]  [JA]                         │
├─────────────────────────────────────┤
│  商品名                              │
│  ┌───────────────────────────────┐  │
│  │ 伝統的なアオザイ                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  説明                               │
│  ┌───────────────────────────────┐  │
│  │ ベトナムのアオザイ...             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB strategy | Column suffix (_ja) | Simple, no JOIN, fits current structure |
| Required language | Vietnamese only | Japanese optional, fallback supported |
| Slug i18n | No (keep VI slug) | Simpler URLs, no redirect logic needed |
| Admin UI | Tab switching | Clean UX, not cluttered |
| API response | Localized by Accept-Language | Auto-fallback to Vietnamese |

---

## Implementation Scope

### Backend (~15 files)

1. **Migration**: Add _ja columns to 5 tables
2. **Models**: Update structs with Ja fields
3. **DTOs**: Include _ja in response types
4. **Requests**: Accept _ja in create/update
5. **Utils**: Create i18n helper functions
6. **Controllers**: Apply localization in public APIs

### Frontend (~10 files)

1. **Component**: Reusable `LanguageTabsForm`
2. **Admin Pages**: Update forms for products/categories/tags/widgets
3. **Validation**: Vietnamese required, Japanese optional
4. **API Integration**: Send/receive _ja fields

---

## Validation Rules

| Field | Vietnamese | Japanese |
|-------|------------|----------|
| Product name | Required, max 255 | Optional, max 255 |
| Product description | Optional | Optional |
| Variant name | Required, max 255 | Optional, max 255 |
| Category name | Required, max 255 | Optional, max 255 |
| Category description | Optional | Optional |
| Tag name | Required, max 255 | Optional, max 255 |
| Widget name | Required, max 255 | Optional, max 255 |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Migration breaks existing data | Add columns as nullable, no default |
| Form complexity increases | Reusable tab component |
| API response size grows | Only return _ja when requested (admin) |
| Future 3rd language | Will need more columns; acceptable for now |

---

## Success Criteria

- [ ] Admin can input Japanese text for all specified fields
- [ ] Tab UI switches between VI/JA smoothly
- [ ] Vietnamese validation enforced, Japanese optional
- [ ] Public API returns localized content based on Accept-Language
- [ ] Fallback to Vietnamese when Japanese empty
- [ ] Existing data unaffected after migration

---

## Next Steps

1. Create migration for _ja columns
2. Update backend models/DTOs/requests
3. Add i18n helper functions
4. Create LanguageTabsForm component
5. Update admin CRUD pages
6. Test full flow
