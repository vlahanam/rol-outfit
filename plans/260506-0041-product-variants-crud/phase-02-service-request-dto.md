---
phase: 2
title: Service, Request, DTO
status: pending
---

# Phase 2: Service, Request, DTO

## Files to Create

- `backend/src/internal/requests/product_variant_request.go`
- `backend/src/internal/dto/product_variant_dto.go`
- `backend/src/internal/services/product_variant_service.go`

## Request

```go
type CreateVariantRequest struct {
    Attributes json.RawMessage `json:"attributes"`  // required, valid JSON object
    Price      float64         `json:"price"`
    Stock      int             `json:"stock"`
    Avatar     string          `json:"avatar"`
}

type UpdateVariantRequest struct {
    Attributes json.RawMessage `json:"attributes"`
    Price      *float64        `json:"price"`
    Stock      *int            `json:"stock"`
    Avatar     *string         `json:"avatar"`
    Status     *int8           `json:"status"`
}
```

Validation:
- `Attributes`: required on create, must be valid JSON object (non-empty)
- `Price`: min 0
- `Stock`: min 0

## DTO

```go
type ProductVariantDTO struct {
    ID         string          `json:"id"`
    ProductID  string          `json:"product_id"`
    Attributes json.RawMessage `json:"attributes"`
    Price      float64         `json:"price"`
    Stock      int             `json:"stock"`
    Sold       int             `json:"sold"`
    Avatar     string          `json:"avatar,omitempty"`
    Status     int8            `json:"status"`
    CreatedAt  string          `json:"created_at"`
    UpdatedAt  string          `json:"updated_at"`
}
```

## Service Interface

```go
var (
    ErrVariantNotFound  = errors.New("variant not found")
    ErrVariantForbidden = errors.New("variant does not belong to product")
)

type ProductVariantService interface {
    List(ctx, productID string, offset, limit int) ([]*models.ProductVariant, int64, error)
    GetByID(ctx, productID, id string) (*models.ProductVariant, error)
    Create(ctx, productID string, req *CreateVariantRequest) (*models.ProductVariant, error)
    Update(ctx, productID, id string, req *UpdateVariantRequest) error
    Delete(ctx, productID, id string) error
}
```

## Service Logic Notes

- `GetByID`: fetch by ID, verify `variant.ProductID == productID` → `ErrVariantForbidden` if mismatch
- `Create`: generate UUID, set `ProductID = productID`, `Status = VARIANT_STATUS_ACTIVE`
- `Update`: fetch first, verify ownership, build fields map
- `Delete`: fetch first, verify ownership, hard delete

## Todo

- [ ] Create `requests/product_variant_request.go`
- [ ] Create `dto/product_variant_dto.go`
- [ ] Create `services/product_variant_service.go`
