---
phase: 01
title: "Backend – tag filter on GET /products"
status: pending
priority: P1
effort: 1h
---

# Phase 01 – Backend: Tag Filter on GET /products

## Context Links
- Controller: `backend/src/internal/controllers/product_controller.go`
- Service: `backend/src/internal/services/product_service.go`
- Repo: `backend/src/internal/repositories/product_repo.go`
- Routes: `backend/src/internal/initialize/route.go`

## Overview
Add optional `tag` query parameter (tag slug) to `GET /api/v1/products`. When provided, only return products that have that tag **actively applied** (tag time window respected). No changes to other endpoints.

## Requirements
- `GET /api/v1/products?tag=new` returns only products with an active tag whose slug = "new"
- Tag time window (start_at / end_at) must be respected — inactive tags do NOT match
- Existing behavior (no `tag` param) unchanged
- Pagination and `category_id` filter still work alongside `tag`

## Architecture

### SQL Join Strategy
Extend `ListProducts` with an optional JOIN when `tagSlug != ""`:

```sql
-- When tagSlug provided, add JOIN:
JOIN product_tags ON product_tags.product_id = products.id
JOIN tags          ON tags.id = product_tags.tag_id
WHERE products.deleted_at IS NULL
  AND products.status = 1
  AND tags.slug = ?                                          -- tagSlug
  AND (tags.start_at IS NULL OR tags.start_at <= NOW())
  AND (tags.end_at   IS NULL OR tags.end_at   >= NOW())
```

No separate repo method — just conditional branching inside `ListProducts`.

## Implementation Steps

### 1. `product_repo.go` — extend `ListProducts`

**Interface** (`ProductRepository`): add `tagSlug string` to `ListProducts` signature.

```go
ListProducts(ctx context.Context, categoryID, tagSlug string, offset, limit int) ([]*models.Product, int64, error)
```

**Implementation** — branch on `tagSlug`:
```go
func (r *postgreStorage) ListProducts(ctx context.Context, categoryID, tagSlug string, offset, limit int) ([]*models.Product, int64, error) {
    var products []*models.Product
    var total int64

    db := r.db.WithContext(ctx).Model(&models.Product{}).
        Where("products.deleted_at IS NULL AND products.status = ?", models.PRODUCT_STATUS_ACTIVE)
    
    if tagSlug != "" {
        now := time.Now()
        db = db.
            Joins("JOIN product_tags ON product_tags.product_id = products.id").
            Joins("JOIN tags ON tags.id = product_tags.tag_id").
            Where("tags.slug = ?", tagSlug).
            Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now)
    }
    if categoryID != "" {
        db = db.Where("products.category_id = ?", categoryID)
    }
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, fmt.Errorf("failed to count products: %w", err)
    }
    if err := db.Offset(offset).Limit(limit).Order("products.created_at DESC").Find(&products).Error; err != nil {
        return nil, 0, fmt.Errorf("failed to list products: %w", err)
    }
    return products, total, nil
}
```

> **Note:** Prefix `products.` on columns when JOIN is active to avoid ambiguous column errors.

### 2. `product_service.go` — update `List()` signature

```go
// Interface
List(ctx context.Context, categoryID, tagSlug string, offset, limit int) ([]*models.Product, int64, error)

// Implementation
func (s *productService) List(ctx context.Context, categoryID, tagSlug string, offset, limit int) ([]*models.Product, int64, error) {
    return s.repo.ListProducts(ctx, categoryID, tagSlug, offset, limit)
}
```

### 3. `product_controller.go` — read `tag` query param

In `ListProducts` controller:
```go
categoryID := ctx.Query("category_id")
tagSlug    := ctx.Query("tag")
// ...
products, total, err := svc.List(ctx.Context(), categoryID, tagSlug, offset, p.Limit)
```

## Todo
- [ ] Update `ProductRepository` interface: add `tagSlug` to `ListProducts`
- [ ] Update `ListProducts` repo impl: conditional JOIN on tags
- [ ] Update `ProductService` interface + impl: add `tagSlug` param to `List()`
- [ ] Update `ListProducts` controller: read `tag` query param, pass to service
- [ ] Compile: `cd backend && go build ./...`

## Success Criteria
- `go build ./...` passes with no errors
- `GET /api/v1/products?tag=new` returns products with active "NEW" tag
- `GET /api/v1/products` (no tag param) returns all active products as before
- `GET /api/v1/products?tag=new&category_id=X` combines both filters

## Risk Assessment
- **Ambiguous columns on JOIN**: mitigated by prefixing `products.` on `deleted_at`, `status`, `category_id`, `created_at` in query
- **Duplicate rows if product has multiple tags**: not possible here since we filter by specific slug, GORM `.Find` won't duplicate
