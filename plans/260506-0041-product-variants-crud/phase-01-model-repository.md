---
phase: 1
title: Model & Repository
status: pending
---

# Phase 1: Model & Repository

## Files to Create/Modify

- **Create:** `backend/src/internal/models/product_variant.go`
- **Modify:** `backend/src/internal/models/product.go` — add `AttributeNames`
- **Create:** `backend/src/internal/repositories/product_variant_repo.go`

## Model

```go
// product_variant.go
package models

import (
    "encoding/json"
    "time"
)

const (
    VARIANT_STATUS_ACTIVE = int8(1)
    VARIANT_STATUS_HIDDEN = int8(2)
)

type ProductVariant struct {
    ID         string          `gorm:"type:uuid;primaryKey"`
    ProductID  string          `gorm:"column:product_id;type:uuid"`
    Attributes json.RawMessage `gorm:"column:attributes;type:jsonb"`
    Price      float64         `gorm:"column:price;type:numeric(12,2)"`
    Stock      int             `gorm:"column:stock"`
    Sold       int             `gorm:"column:sold"`
    Avatar     string          `gorm:"column:avatar"`
    Status     int8            `gorm:"column:status"`
    CreatedAt  time.Time       `gorm:"column:created_at"`
    UpdatedAt  time.Time       `gorm:"column:updated_at"`
}

func (ProductVariant) TableName() string { return "product_variants" }
```

**Update Product model** — add missing field:
```go
AttributeNames pq.StringArray `gorm:"column:attribute_names;type:text[]"`
```
(requires `github.com/lib/pq`)

Or use `[]string` with GORM serializer. Check existing go.mod for `lib/pq`.

## Repository Interface

```go
type ProductVariantRepository interface {
    CreateVariant(ctx, v *models.ProductVariant) error
    FindVariantByID(ctx, id string) (*models.ProductVariant, error)
    ListVariants(ctx, productID string, offset, limit int) ([]*models.ProductVariant, int64, error)
    UpdateVariant(ctx, id string, fields map[string]interface{}) error
    DeleteVariant(ctx, id string) error  // hard delete
}
```

## Todo

- [ ] Create `models/product_variant.go`
- [ ] Update `models/product.go` with `AttributeNames`
- [ ] Create `repositories/product_variant_repo.go` with full implementation
- [ ] Check go.mod for `lib/pq` dependency

## Notes

- No soft-delete: `DeleteVariant` does a hard `DELETE FROM product_variants WHERE id = ?`
- `ListVariants` filters by `product_id`; no status filter in public list (show all active only)
- Admin list could show all statuses — keep it simple: one list returning all variants for a product (admin sees all, public sees only status=1)
