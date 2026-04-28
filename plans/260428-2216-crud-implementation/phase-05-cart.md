---
title: Cart CRUD
status: todo
priority: high
phase: 5
---

# Phase 5: Cart CRUD

## Overview

Implement giỏ hàng cho user đã đăng nhập: xem, thêm item, cập nhật số lượng, xóa item. Mỗi user chỉ có 1 cart (auto-create nếu chưa có).

## Context Links

- Auth middleware: `backend/src/internal/middleware/jwt_middleware.go` (Phase 1)
- Cart repo: `backend/src/internal/repositories/cart_repo.go` (Phase 3)
- Models: `backend/src/internal/models/cart.go` (Phase 2)

## Architecture

```
All cart routes → JWTAuth middleware (userID from ctx.Locals)
GET  /api/v1/cart                → trả cart + items của user
POST /api/v1/cart/items          → thêm item vào cart
PUT  /api/v1/cart/items/:itemID  → cập nhật quantity
DELETE /api/v1/cart/items/:itemID → xóa item
```

Cart tự động được tạo nếu user chưa có (FindOrCreateCart).

## Related Code Files

**Create:**
- `backend/src/internal/dto/cart_dto.go`
- `backend/src/internal/requests/cart_request.go`
- `backend/src/internal/services/cart_service.go`
- `backend/src/internal/controllers/cart_controller.go`

**Modify:**
- `backend/src/internal/initialize/route.go`
- `backend/src/internal/i18n/locales/vi.json`
- `backend/src/internal/i18n/locales/ja.json`

## DTOs

### cart_dto.go
```go
type CartItemDTO struct {
    ID         string  `json:"id"`
    ProductID  string  `json:"product_id"`
    AttrID     string  `json:"attr_id,omitempty"`
    PriceAtAdd float64 `json:"price_at_add"`
    Quantity   int     `json:"quantity"`
}

type CartDTO struct {
    ID        string        `json:"id"`
    UserID    string        `json:"user_id"`
    Items     []*CartItemDTO `json:"items"`
    CreatedAt string        `json:"created_at"`
}

func ToCartDTO(cart *models.Cart, items []*models.CartItem) *CartDTO { ... }
```

## Requests

### cart_request.go
```go
type AddCartItemRequest struct {
    ProductID string  `json:"product_id"`
    AttrID    string  `json:"attr_id"`
    Quantity  int     `json:"quantity"`
}
func (r AddCartItemRequest) Validate() error {
    // product_id required (valid UUID), quantity >= 1
}

type UpdateCartItemRequest struct {
    Quantity int `json:"quantity"`
}
func (r UpdateCartItemRequest) Validate() error {
    // quantity >= 1
}
```

## Service

### cart_service.go
```go
var ErrCartItemNotFound   = errors.New("cart item not found")
var ErrCartItemNotOwned   = errors.New("cart item does not belong to user")
var ErrProductNotFound    = errors.New("product not found")

type CartService interface {
    GetCart(ctx context.Context, userID string) (*models.Cart, []*models.CartItem, error)
    AddItem(ctx context.Context, userID string, req *AddCartItemRequest) (*models.CartItem, error)
    UpdateItem(ctx context.Context, userID, itemID string, req *UpdateCartItemRequest) error
    RemoveItem(ctx context.Context, userID, itemID string) error
}
```

**AddItem logic:**
1. `FindOrCreateCart(userID)` → get/create cart
2. `FindProductByID(productID)` → verify product exists & active
3. `FindCartItem(cartID, productID, attrID)` → if exists, increment quantity; else create new
4. price_at_add = product.DefaultPrice (snapshot at add time)

**UpdateItem / RemoveItem:** verify item belongs to user's cart trước khi thay đổi.

## Controller

### cart_controller.go

```go
// GetCart GET /api/v1/cart
func GetCart(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        userID := ctx.Locals("userID").(string)
        // ...
    }
}

// AddCartItem POST /api/v1/cart/items
func AddCartItem(db *gorm.DB) fiber.Handler { ... }

// UpdateCartItem PUT /api/v1/cart/items/:itemID
func UpdateCartItem(db *gorm.DB) fiber.Handler { ... }

// RemoveCartItem DELETE /api/v1/cart/items/:itemID
func RemoveCartItem(db *gorm.DB) fiber.Handler { ... }
```

## Route Registration (route.go)

```go
cart := v1.Group("/cart", middleware.JWTAuth(jwtSecret))
cart.Get("/", controllers.GetCart(db))
cart.Post("/items", controllers.AddCartItem(db))
cart.Put("/items/:itemID", controllers.UpdateCartItem(db))
cart.Delete("/items/:itemID", controllers.RemoveCartItem(db))
```

## i18n Keys

```json
"error.cart_item_not_found": "Mục giỏ hàng không tồn tại",
"error.cart_item_not_owned": "Bạn không có quyền thao tác mục này",
"validation.product_id.required": "Sản phẩm không được để trống",
"validation.quantity.min": "Số lượng phải ít nhất là 1"
```

## Todo List

- [ ] Tạo `dto/cart_dto.go`
- [ ] Tạo `requests/cart_request.go`
- [ ] Tạo `services/cart_service.go`
- [ ] Tạo `controllers/cart_controller.go` (4 handlers)
- [ ] Cập nhật `initialize/route.go` — thêm cart routes
- [ ] Thêm i18n keys vào `vi.json` + `ja.json`
- [ ] Compile check: `cd backend && go build ./...`

## Success Criteria

- GET /api/v1/cart không có token → 401
- GET /api/v1/cart với token → trả cart với items
- POST /api/v1/cart/items thêm sản phẩm → quantity tích lũy nếu thêm cùng product
- DELETE /api/v1/cart/items/:id của user khác → 403
