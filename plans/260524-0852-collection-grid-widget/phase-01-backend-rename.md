# Phase 1: Backend Type Rename

**Status:** pending  
**Est:** 20 min  
**Priority:** high

## Overview

Rename widget type `list-image` → `collection-grid` trong backend Go code và database.

## Requirements

- Rename const trong model
- Update seeder
- Handle DB migration cho enum type

## Related Files

| File | Action |
|------|--------|
| `backend/src/internal/models/widget.go` | Modify |
| `backend/src/internal/seeder/seed_widgets.go` | Modify |
| DB migration (nếu cần) | Create |

## Implementation Steps

### 1. Update widget.go model

```go
// backend/src/internal/models/widget.go
const (
    WidgetTypeBannerSlider   WidgetType = "banner-slider"
    WidgetTypeCollectionGrid WidgetType = "collection-grid"  // renamed from list-image
    WidgetTypeNewProduct     WidgetType = "new-product"
    WidgetTypeTrendHot       WidgetType = "trend-hot"
)
```

### 2. Update seeder

```go
// backend/src/internal/seeder/seed_widgets.go
var widgets = []seedWidget{
    {Name: "Banner Slider",        Type: models.WidgetTypeBannerSlider,   DisplayOrder: 1, Status: 2},
    {Name: "Bộ Sưu Tập Đặc Biệt", Type: models.WidgetTypeCollectionGrid, DisplayOrder: 2, Status: 2},  // changed
    {Name: "Hàng Mới Về",          Type: models.WidgetTypeNewProduct,     DisplayOrder: 3, Status: 2},
    {Name: "Xu Hướng Hot",         Type: models.WidgetTypeTrendHot,       DisplayOrder: 4, Status: 2},
}
```

### 3. DB Migration

Option A - Raw SQL (if using pg enum):
```sql
ALTER TYPE widget_type RENAME VALUE 'list-image' TO 'collection-grid';
```

Option B - Update existing rows:
```sql
UPDATE widgets SET type = 'collection-grid' WHERE type = 'list-image';
```

Check current DB constraint first:
```bash
make db-shell
\d widgets
# Check if type is enum or varchar
```

### 4. Grep check for other references

```bash
grep -rn "list-image\|ListImage" backend/
```

## Todo

- [ ] Backup database before migration
- [ ] Update `widget.go` const name and value
- [ ] Update `seed_widgets.go` to use new const
- [ ] Run migration/update SQL
- [ ] Verify: `SELECT * FROM widgets WHERE type = 'collection-grid';`
- [ ] Test backend still compiles: `cd backend && go build ./...`

## Success Criteria

- [ ] Backend compiles without errors
- [ ] Widget type `collection-grid` accepted by API
- [ ] Existing widget preserved with new type

## Notes

- If DB uses varchar for type column, only need UPDATE statement
- If DB uses enum, need ALTER TYPE
