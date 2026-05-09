# Phase 02 — Backend Model + DTO

**Status:** done | **Effort:** 1h | **Depends on:** Phase 01

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/internal/models/product.go` | Add discount fields to Product struct |
| `backend/src/internal/models/product_variant.go` | Add discount fields to ProductVariant struct |
| `backend/src/internal/dto/product_dto.go` | Add SalePrice + discount fields to all product DTOs |
| `backend/src/internal/dto/product_variant_dto.go` | Add SalePrice + discount fields |

## File to Create

| File | Description |
|------|-------------|
| `backend/src/internal/dto/discount_helper.go` | Shared helpers: `IsDiscountActive`, `EffectivePrice` |

---

## models/product.go — Add fields to Product struct

```go
type Product struct {
    // ... existing fields ...
    DiscountPercent  float64    `gorm:"column:discount_percent;type:numeric(5,2)"`
    DiscountStartAt  *time.Time `gorm:"column:discount_start_at"`
    DiscountEndAt    *time.Time `gorm:"column:discount_end_at"`
}
```

## models/product_variant.go — Add fields to ProductVariant struct

```go
type ProductVariant struct {
    // ... existing fields ...
    DiscountPercent  float64    `gorm:"column:discount_percent;type:numeric(5,2)"`
    DiscountStartAt  *time.Time `gorm:"column:discount_start_at"`
    DiscountEndAt    *time.Time `gorm:"column:discount_end_at"`
}
```

---

## dto/discount_helper.go (NEW)

```go
package dto

import "time"

// IsDiscountActive returns true if percent > 0 and current time falls within [start, end].
// Nil start/end means no constraint on that side.
func IsDiscountActive(percent float64, start, end *time.Time) bool {
    if percent <= 0 {
        return false
    }
    now := time.Now()
    if start != nil && now.Before(*start) {
        return false
    }
    if end != nil && now.After(*end) {
        return false
    }
    return true
}

// EffectivePrice returns price after applying discount if active, else original price.
func EffectivePrice(price float64, percent float64, start, end *time.Time) float64 {
    if !IsDiscountActive(percent, start, end) {
        return price
    }
    return price * (1 - percent/100)
}

// formatTime returns RFC3339 string or empty string for nil pointer.
func formatTimePtr(t *time.Time) string {
    if t == nil {
        return ""
    }
    return t.Format(time.RFC3339)
}
```

---

## dto/product_dto.go — ProductDTO

Add fields and compute `SalePrice`:

```go
type ProductDTO struct {
    // ... existing fields ...
    DiscountPercent  float64 `json:"discount_percent"`
    DiscountStartAt  string  `json:"discount_start_at,omitempty"`
    DiscountEndAt    string  `json:"discount_end_at,omitempty"`
    SalePrice        float64 `json:"sale_price"` // = default_price if no active discount
}

func ToProductDTO(p *models.Product) *ProductDTO {
    // ... existing mappings ...
    return &ProductDTO{
        // ... existing fields ...
        DiscountPercent: p.DiscountPercent,
        DiscountStartAt: formatTimePtr(p.DiscountStartAt),
        DiscountEndAt:   formatTimePtr(p.DiscountEndAt),
        SalePrice:       EffectivePrice(p.DefaultPrice, p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt),
    }
}
```

Apply same additions to `ProductWithVariantsDTO` and `ToProductWithVariantsDTO`.

---

## dto/product_variant_dto.go — ProductVariantDTO

Priority: variant discount → product discount fallback → original price.
The `SalePrice` on variant needs product's discount as fallback. Signature change:

```go
type ProductVariantDTO struct {
    // ... existing fields ...
    DiscountPercent  float64 `json:"discount_percent"`
    DiscountStartAt  string  `json:"discount_start_at,omitempty"`
    DiscountEndAt    string  `json:"discount_end_at,omitempty"`
    SalePrice        float64 `json:"sale_price"`
}

// ToVariantDTOWithProduct computes effective price with product-level fallback.
func ToVariantDTOWithProduct(v *models.ProductVariant, p *models.Product) *ProductVariantDTO {
    salePrice := v.Price
    if IsDiscountActive(v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt) {
        salePrice = EffectivePrice(v.Price, v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt)
    } else if p != nil && IsDiscountActive(p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt) {
        salePrice = EffectivePrice(v.Price, p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt)
    }
    return &ProductVariantDTO{
        // ... existing fields ...
        DiscountPercent: v.DiscountPercent,
        DiscountStartAt: formatTimePtr(v.DiscountStartAt),
        DiscountEndAt:   formatTimePtr(v.DiscountEndAt),
        SalePrice:       salePrice,
    }
}

// Keep ToVariantDTO for backward compat (no product fallback, variant-only discount).
func ToVariantDTO(v *models.ProductVariant) *ProductVariantDTO {
    return ToVariantDTOWithProduct(v, nil)
}
```

### Update ToProductWithVariantsDTO

Change the variants loop to pass product for fallback:

```go
for _, v := range p.Variants {
    variants = append(variants, ToVariantDTOWithProduct(v, p.Product))
    // ...
}
```

And in `ToProductWithVariantsDTOWithTags` — same change.

## Todo

- [x] Add discount fields to `models/product.go`
- [x] Add discount fields to `models/product_variant.go`
- [x] Create `dto/discount_helper.go`
- [x] Update `dto/product_dto.go` (ProductDTO + ProductWithVariantsDTO)
- [x] Update `dto/product_variant_dto.go` (add `ToVariantDTOWithProduct`, update `ToVariantDTO`)
- [x] Fix variants loop in `ToProductWithVariantsDTO` to use `ToVariantDTOWithProduct`
- [x] `go build ./...` — no errors
