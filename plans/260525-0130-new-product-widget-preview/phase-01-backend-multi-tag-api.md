# Phase 1: Backend Multi-Tag API

**Status:** complete  
**Priority:** high  
**Estimated:** 1 hour

## Overview

Extend `GET /api/v1/products` to support comma-separated tags parameter with OR logic.

## Files to Modify

| File | Action |
|------|--------|
| `backend/src/internal/repositories/product_repo.go` | Modify `ListProducts` signature |
| `backend/src/internal/services/product_service.go` | Update service layer |
| `backend/src/internal/controllers/product_controller.go` | Parse `tags` param |

## Implementation Steps

### 1. Update Repository Interface

**File:** `backend/src/internal/repositories/product_repo.go`

Change signature:
```go
// Before
ListProducts(ctx context.Context, categoryID, tagSlug string, offset, limit int) ([]*models.Product, int64, error)

// After
ListProducts(ctx context.Context, categoryID string, tagSlugs []string, offset, limit int) ([]*models.Product, int64, error)
```

### 2. Modify Query Logic

```go
func (r *postgreStorage) ListProducts(ctx context.Context, categoryID string, tagSlugs []string, offset, limit int) ([]*models.Product, int64, error) {
    db := r.db.WithContext(ctx).Model(&models.Product{}).
        Where("products.deleted_at IS NULL AND products.status = ?", models.PRODUCT_STATUS_ACTIVE)

    if len(tagSlugs) > 0 {
        now := time.Now()
        db = db.
            Joins("JOIN product_tags ON product_tags.product_id = products.id").
            Joins("JOIN tags ON tags.id = product_tags.tag_id").
            Where("tags.slug IN ?", tagSlugs).
            Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
            Distinct("products.*")
    }
    // ... rest unchanged
}
```

### 3. Update Controller

**File:** `backend/src/internal/controllers/product_controller.go`

```go
func ListProducts(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        // Parse comma-separated tags
        tagsParam := ctx.Query("tags")
        var tagSlugs []string
        if tagsParam != "" {
            tagSlugs = strings.Split(tagsParam, ",")
        }
        
        // Backward compat: support single "tag" param
        if singleTag := ctx.Query("tag"); singleTag != "" && len(tagSlugs) == 0 {
            tagSlugs = []string{singleTag}
        }
        
        products, total, err := svc.List(ctx.Context(), categoryID, tagSlugs, offset, p.Limit)
        // ...
    }
}
```

### 4. Update Service Layer

**File:** `backend/src/internal/services/product_service.go`

Update `List` method signature to accept `[]string` instead of `string`.

## Todo

- [x] Update `ProductRepository` interface
- [x] Modify `ListProducts` implementation for multi-tag
- [x] Update `ProductService.List` signature
- [x] Update controller to parse `tags` param
- [x] Maintain backward compat with single `tag` param
- [x] Test with: `GET /products?tags=tag1,tag2&limit=10`

## Verification

```bash
# Test multi-tag query
curl "http://localhost:8080/api/v1/products?tags=new-arrival,summer&limit=5"

# Backward compat
curl "http://localhost:8080/api/v1/products?tag=new-arrival&limit=5"
```

## Notes

- Use `DISTINCT` to avoid duplicate products when matching multiple tags
- Keep backward compatibility with single `tag` parameter
- Max 10 tags to prevent query performance issues
