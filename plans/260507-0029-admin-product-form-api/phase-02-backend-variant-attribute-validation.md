---
title: "Phase 2: Backend – Variant Attribute Validation"
status: completed
priority: high
completed: 2026-05-07
---

# Phase 2: Backend – Variant Attribute Validation

## Overview

When creating or updating a `ProductVariant`, validate that the `attributes` JSONB keys exactly match the product's `attribute_names`. Reject if keys are missing or extra keys are present.

**Why**: Without this, a variant can be created with `{"Color":"Red"}` even if the product's `attribute_names` is `["Size","Color"]`, leaving `Size` undefined.

## Related Files

- `backend/src/internal/services/product_variant_service.go` — add validation logic
- `backend/src/internal/repositories/product_repo.go` — reuse `FindProductByID` (or add lightweight fetch)
- `backend/src/internal/i18n/locales/vi.json` — add error key
- `backend/src/internal/i18n/locales/ja.json` — add error key

## New Error

```
ErrVariantAttributesMismatch = errors.New("variant attributes do not match product attribute_names")
```

i18n key: `error.variant_attributes_mismatch`

## Implementation Steps

### Step 1 – New service error

In `product_variant_service.go`:

```go
var (
    ErrVariantNotFound          = errors.New("variant not found")
    ErrVariantForbidden         = errors.New("variant does not belong to product")
    ErrVariantAttributesMismatch = errors.New("variant attributes do not match product attribute_names")
)
```

### Step 2 – Helper: validate attributes against attribute_names

Add a private helper in `product_variant_service.go`:

```go
// validateAttributes checks that the JSON object keys match exactly the product's attribute_names.
// Returns ErrVariantAttributesMismatch if keys differ.
func validateAttributes(raw json.RawMessage, attrNames models.StringSlice) error {
    if len(attrNames) == 0 {
        return nil // product has no defined attribute schema – allow any attributes
    }
    var attrs map[string]interface{}
    if err := json.Unmarshal(raw, &attrs); err != nil {
        return ErrVariantAttributesMismatch
    }
    expected := make(map[string]struct{}, len(attrNames))
    for _, k := range attrNames {
        expected[k] = struct{}{}
    }
    got := make(map[string]struct{}, len(attrs))
    for k := range attrs {
        got[k] = struct{}{}
    }
    // Check every expected key is present
    for k := range expected {
        if _, ok := got[k]; !ok {
            return ErrVariantAttributesMismatch
        }
    }
    // Check no extra keys
    for k := range got {
        if _, ok := expected[k]; !ok {
            return ErrVariantAttributesMismatch
        }
    }
    return nil
}
```

### Step 3 – Inject `ProductRepository` into variant service

Currently `productVariantService` only holds `ProductVariantRepository`. We need access to the product to read its `attribute_names`.

Change the struct and constructor:

```go
type productVariantService struct {
    repo     repositories.ProductVariantRepository
    prodRepo repositories.ProductRepository
}

func NewProductVariantService(repo repositories.ProductVariantRepository, prodRepo repositories.ProductRepository) ProductVariantService {
    return &productVariantService{repo: repo, prodRepo: prodRepo}
}
```

Update all callers in controllers (`product_variant_controller.go`) to pass `repositories.NewPostgreSQLStorage(db)` for both args (it implements both interfaces):

```go
repo := repositories.NewPostgreSQLStorage(db)
svc := services.NewProductVariantService(repo, repo)
```

### Step 4 – Apply validation in `Create`

```go
func (s *productVariantService) Create(ctx context.Context, productID string, req *requests.CreateVariantRequest) (*models.ProductVariant, error) {
    product, err := s.prodRepo.FindProductByID(ctx, productID)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch product: %w", err)
    }
    if product == nil {
        return nil, ErrVariantNotFound // product not found
    }
    if err := validateAttributes(req.Attributes, product.AttributeNames); err != nil {
        return nil, err
    }

    v := &models.ProductVariant{
        ID:         uuid.New().String(),
        ProductID:  productID,
        Attributes: req.Attributes,
        Price:      req.Price,
        Stock:      req.Stock,
        Avatar:     req.Avatar,
        Status:     models.VARIANT_STATUS_ACTIVE,
    }
    if err := s.repo.CreateVariant(ctx, v); err != nil {
        return nil, fmt.Errorf("failed to create variant: %w", err)
    }
    return v, nil
}
```

### Step 5 – Apply validation in `Update`

In the `Update` method, after the ownership check, before updating attributes:

```go
if len(req.Attributes) > 0 {
    product, err := s.prodRepo.FindProductByID(ctx, productID)
    if err != nil {
        return fmt.Errorf("failed to fetch product: %w", err)
    }
    if product == nil {
        return ErrVariantForbidden
    }
    if err := validateAttributes(req.Attributes, product.AttributeNames); err != nil {
        return err
    }
    fields["attributes"] = req.Attributes
}
```

### Step 6 – Controller: handle new error

In `product_variant_controller.go`, in both `CreateVariant` and `UpdateVariant` handlers:

```go
if errors.Is(err, services.ErrVariantAttributesMismatch) {
    return ctx.Status(fiber.StatusBadRequest).JSON(
        common.ErrBadRequest.WithReason(i18n.T(lang, "error.variant_attributes_mismatch")),
    )
}
```

### Step 7 – i18n keys

`vi.json`:
```json
"error.variant_attributes_mismatch": "Thuộc tính biến thể không khớp với danh sách thuộc tính sản phẩm"
```

`ja.json`:
```json
"error.variant_attributes_mismatch": "バリアント属性が商品の属性名と一致しません"
```

### Step 8 – Compile check

```bash
cd backend && go build ./...
```

## Note on `FindProductByID`

The existing `FindProductByID` filters `status = ACTIVE`. If a product is hidden (status=2), variant create/update will fail with "product not found". This is acceptable: hidden products should not accept new variants through the public flow. If this becomes an issue, add `FindProductByIDAdmin` (already added in Phase 1) to the variant service lookup.

Actually, reconsider: admin can still manage variants on hidden products. Use a simpler lookup without status filter. The `FindProductByIDAdmin` from Phase 1 returns `*ProductWithVariants` which is heavier than needed. Add a lightweight method:

```go
// FindProductByIDNoStatusFilter — used internally for attribute validation.
// Returns product ignoring status (for admin variant management).
FindProductByIDNoFilter(ctx context.Context, id string) (*models.Product, error)
```

Implementation:
```go
func (r *postgreStorage) FindProductByIDNoFilter(ctx context.Context, id string) (*models.Product, error) {
    var p models.Product
    err := r.db.WithContext(ctx).
        Where("id = ? AND deleted_at IS NULL", id).
        First(&p).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to find product: %w", err)
    }
    return &p, nil
}
```

Use this in variant service instead of `FindProductByID`.

## Success Criteria

- Creating a variant with mismatched keys returns 400 `error.variant_attributes_mismatch`
- Creating a variant with correct keys succeeds
- Product with empty `attribute_names` accepts any attributes
- Compiles with no errors

## Todo

- [x] Add `ErrVariantAttributesMismatch` error
- [x] Add `validateAttributes` helper
- [x] Add `FindProductByIDNoFilter` to repo interface + implementation
- [x] Inject `prodRepo` into `productVariantService`
- [x] Update all `NewProductVariantService` call sites (pass `repo, repo`)
- [x] Apply validation in `Create` and `Update`
- [x] Handle new error in `CreateVariant` and `UpdateVariant` controllers
- [x] Add i18n keys to `vi.json` and `ja.json`
- [x] Run `go build ./...`
