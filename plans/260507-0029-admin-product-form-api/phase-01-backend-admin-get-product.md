---
title: "Phase 1: Backend – Admin Product Detail Endpoint"
status: completed
priority: high
completed: 2026-05-07
---

# Phase 1: Backend – Admin Product Detail Endpoint

## Overview

Add `GET /api/v1/admin/products/:id` that returns the full product (any status, not deleted) with all its variants. Used by the admin edit page.

**Why new endpoint**: The existing `GET /api/v1/products/:id` is public and filters `status = ACTIVE`. Admins need to fetch hidden/draft products too.

## Related Files

- `backend/src/internal/repositories/product_repo.go` — add `FindProductByIDAdmin`
- `backend/src/internal/services/product_service.go` — add `AdminGetByID`
- `backend/src/internal/controllers/product_controller.go` — add `AdminGetProduct`
- `backend/src/internal/initialize/route.go` — register route

## Implementation Steps

### Step 1 – Repository: `FindProductByIDAdmin`

In `product_repo.go`, add to the `ProductRepository` interface:

```go
FindProductByIDAdmin(ctx context.Context, id string) (*models.ProductWithVariants, error)
```

Implementation:

```go
func (r *postgreStorage) FindProductByIDAdmin(ctx context.Context, id string) (*models.ProductWithVariants, error) {
    var p models.Product
    err := r.db.WithContext(ctx).
        Where("id = ? AND deleted_at IS NULL", id).
        First(&p).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to find product by id (admin): %w", err)
    }

    var variants []*models.ProductVariant
    if err := r.db.WithContext(ctx).
        Where("product_id = ?", id).
        Order("created_at ASC").
        Find(&variants).Error; err != nil {
        return nil, fmt.Errorf("failed to fetch variants for admin product: %w", err)
    }

    return &models.ProductWithVariants{Product: &p, Variants: variants}, nil
}
```

### Step 2 – Service: `AdminGetByID`

In `product_service.go`, add to `ProductService` interface:

```go
AdminGetByID(ctx context.Context, id string) (*models.ProductWithVariants, error)
```

Implementation:

```go
func (s *productService) AdminGetByID(ctx context.Context, id string) (*models.ProductWithVariants, error) {
    pw, err := s.repo.FindProductByIDAdmin(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("failed to get admin product: %w", err)
    }
    if pw == nil {
        return nil, ErrProductNotFound
    }
    return pw, nil
}
```

### Step 3 – Controller: `AdminGetProduct`

In `product_controller.go`, add:

```go
// AdminGetProduct GET /api/v1/admin/products/:id [admin]
func AdminGetProduct(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        id := ctx.Params("id")

        if _, err := uuid.Parse(id); err != nil {
            return ctx.Status(fiber.StatusBadRequest).JSON(
                common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
            )
        }

        repo := repositories.NewPostgreSQLStorage(db)
        svc := services.NewProductService(repo)

        pw, err := svc.AdminGetByID(ctx.Context(), id)
        if err != nil {
            if errors.Is(err, services.ErrProductNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(
                    common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
                )
            }
            slog.Error("AdminGetProduct failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.JSON(common.ResponseData(dto.ToProductWithVariantsDTO(pw)))
    }
}
```

### Step 4 – Route registration

In `route.go`, inside `adminProductsGroup`:

```go
adminProductsGroup.Get("/", controllers.AdminListProducts(db))
adminProductsGroup.Get("/:id", controllers.AdminGetProduct(db))  // ADD THIS
```

### Step 5 – Compile check

```bash
cd backend && go build ./...
```

## Success Criteria

- `GET /api/v1/admin/products/:id` returns 200 with `ProductWithVariantsDTO`
- Hidden products (status=2) are returned
- Non-existent ID returns 404
- Compiles with no errors

## Todo

- [x] Add `FindProductByIDAdmin` to `ProductRepository` interface and implement
- [x] Add `AdminGetByID` to `ProductService` interface and implement
- [x] Add `AdminGetProduct` controller
- [x] Register route in `route.go`
- [x] Run `go build ./...`
