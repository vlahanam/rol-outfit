# Phase 03 — Backend Request + Service + Cart

**Status:** done | **Effort:** 1.5h | **Depends on:** Phase 02

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/internal/requests/product_request.go` | Add discount fields to Create/Update |
| `backend/src/internal/requests/product_variant_request.go` | Add discount fields to Create/Update |
| `backend/src/internal/services/product_service.go` | Handle discount in Create/Update |
| `backend/src/internal/services/product_variant_service.go` | Handle discount in Create/Update |
| `backend/src/internal/services/cart_service.go` | Use effective price; inject variantRepo |

---

## requests/product_request.go

### CreateProductRequest

```go
type CreateProductRequest struct {
    // ... existing fields ...
    DiscountPercent  float64    `json:"discount_percent"`
    DiscountStartAt  *time.Time `json:"discount_start_at"`
    DiscountEndAt    *time.Time `json:"discount_end_at"`
}

// Add to Validate():
validation.Field(&r.DiscountPercent,
    validation.Min(float64(0)).Error("validation.discount.invalid"),
    validation.Max(float64(100)).Error("validation.discount.invalid"),
),
```

### UpdateProductRequest

```go
type UpdateProductRequest struct {
    // ... existing fields ...
    DiscountPercent  *float64   `json:"discount_percent"`
    DiscountStartAt  *time.Time `json:"discount_start_at"`
    DiscountEndAt    *time.Time `json:"discount_end_at"`
}

// Add to Validate():
if r.DiscountPercent != nil {
    if err := validation.Validate(r.DiscountPercent,
        validation.Min(float64(0)).Error("validation.discount.invalid"),
        validation.Max(float64(100)).Error("validation.discount.invalid"),
    ); err != nil {
        return err
    }
}
```

---

## requests/product_variant_request.go

### CreateVariantRequest

```go
type CreateVariantRequest struct {
    // ... existing fields ...
    DiscountPercent  float64    `json:"discount_percent"`
    DiscountStartAt  *time.Time `json:"discount_start_at"`
    DiscountEndAt    *time.Time `json:"discount_end_at"`
}
```

### UpdateVariantRequest

```go
type UpdateVariantRequest struct {
    // ... existing fields ...
    DiscountPercent  *float64   `json:"discount_percent"`
    DiscountStartAt  *time.Time `json:"discount_start_at"`
    DiscountEndAt    *time.Time `json:"discount_end_at"`
}
```

Add same Min/Max 0–100 validation for both.

---

## services/product_service.go

### Create — add discount fields to Product struct

```go
p := &models.Product{
    // ... existing ...
    DiscountPercent: req.DiscountPercent,
    DiscountStartAt: req.DiscountStartAt,
    DiscountEndAt:   req.DiscountEndAt,
}
```

### Update — handle discount fields in fields map

```go
if req.DiscountPercent != nil {
    fields["discount_percent"] = *req.DiscountPercent
}
// Always update time pointers (allow setting to nil to clear)
if _, ok := /* req has DiscountStartAt key */; ok {
    fields["discount_start_at"] = req.DiscountStartAt  // nil clears the column
}
if _, ok := /* req has DiscountEndAt key */; ok {
    fields["discount_end_at"] = req.DiscountEndAt
}
```

**Note:** Since `*time.Time` pointer zero value is nil (not sent in JSON), use a wrapper or always update if the field is present in payload. Simplest: always include in fields map when the parent pointer field is not nil OR when explicitly setting to zero.

Simplest working approach — update discount fields whenever `DiscountPercent` is provided:
```go
if req.DiscountPercent != nil {
    fields["discount_percent"] = *req.DiscountPercent
    fields["discount_start_at"] = req.DiscountStartAt // nil = clear
    fields["discount_end_at"]   = req.DiscountEndAt   // nil = clear
}
```

---

## services/product_variant_service.go

### Create

```go
v := &models.ProductVariant{
    // ... existing ...
    DiscountPercent: req.DiscountPercent,
    DiscountStartAt: req.DiscountStartAt,
    DiscountEndAt:   req.DiscountEndAt,
}
```

### Update

```go
if req.DiscountPercent != nil {
    fields["discount_percent"] = *req.DiscountPercent
    fields["discount_start_at"] = req.DiscountStartAt
    fields["discount_end_at"]   = req.DiscountEndAt
}
```

---

## services/cart_service.go — Effective price on add

Current: `PriceAtAdd: product.DefaultPrice` — ignores variants and discounts.

### Changes

1. Inject `variantRepo repositories.ProductVariantRepository` into `cartService` struct
2. Update `NewCartService` constructor to accept it
3. In `AddItem`, compute effective price:

```go
// Resolve base price: variant price if variant given, else product default
priceAtAdd := product.DefaultPrice
if req.AttrID != "" {
    v, err := s.variantRepo.FindVariantByID(ctx, req.AttrID)
    if err == nil && v != nil && v.ProductID == product.ID {
        priceAtAdd = v.Price
        // Variant discount overrides product discount
        if dto.IsDiscountActive(v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt) {
            priceAtAdd = dto.EffectivePrice(v.Price, v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt)
        } else if dto.IsDiscountActive(product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt) {
            priceAtAdd = dto.EffectivePrice(v.Price, product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt)
        }
    }
} else if dto.IsDiscountActive(product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt) {
    priceAtAdd = dto.EffectivePrice(product.DefaultPrice, product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt)
}

item := &models.CartItem{
    // ...
    PriceAtAdd: priceAtAdd,
}
```

### Constructor update

Find where `NewCartService` is called (in `initialize/route.go` or equivalent) and pass `repo` as `variantRepo` — same `postgreStorage` instance implements both interfaces.

```go
// In route.go / wherever services are initialized:
cartSvc := services.NewCartService(cartRepo, cartItemRepo, productRepo, variantRepo)
// variantRepo = same repo instance (postgreStorage implements all repo interfaces)
```

## Todo

- [x] Add discount fields to `CreateProductRequest` + `UpdateProductRequest` with validation
- [x] Add discount fields to `CreateVariantRequest` + `UpdateVariantRequest` with validation
- [x] Update `product_service.go` Create/Update to persist discount
- [x] Update `product_variant_service.go` Create/Update to persist discount
- [x] Update `cart_service.go`: inject variantRepo, compute effective price in AddItem
- [x] Update `NewCartService` call site in route initialization
- [x] `go build ./...` — no errors
