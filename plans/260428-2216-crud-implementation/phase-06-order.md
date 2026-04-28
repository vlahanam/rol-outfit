---
title: Order CRUD
status: todo
priority: high
phase: 6
---

# Phase 6: Order CRUD

## Overview

Implement đơn hàng: user tạo đơn từ cart, admin quản lý trạng thái. User chỉ xem/hủy đơn của mình.

## Context Links

- Cart service: `backend/src/internal/services/cart_service.go` (Phase 5)
- Order repo: `backend/src/internal/repositories/order_repo.go` (Phase 3)
- Models: `backend/src/internal/models/order.go` (Phase 2)
- Order statuses: `models.ORDER_STATUS_*` constants

## Architecture

```
POST /api/v1/orders              [user]  → tạo order từ cart items
GET  /api/v1/orders              [user]  → danh sách order của user
GET  /api/v1/orders/:id          [user]  → chi tiết order (verify ownership)
DELETE /api/v1/orders/:id        [user]  → hủy đơn (chỉ khi status = PENDING)
PUT  /api/v1/orders/:id/status   [admin] → cập nhật trạng thái
GET  /api/v1/admin/orders        [admin] → toàn bộ orders, filter by status
```

## Related Code Files

**Create:**
- `backend/src/internal/dto/order_dto.go`
- `backend/src/internal/requests/order_request.go`
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/controllers/order_controller.go`

**Modify:**
- `backend/src/internal/initialize/route.go`
- `backend/src/internal/i18n/locales/vi.json`
- `backend/src/internal/i18n/locales/ja.json`

## DTOs

### order_dto.go
```go
type OrderItemDTO struct {
    ID        string  `json:"id"`
    ProductID string  `json:"product_id"`
    AttrID    string  `json:"attr_id,omitempty"`
    Price     float64 `json:"price"`
    Quantity  int     `json:"quantity"`
}

type OrderDTO struct {
    ID              string          `json:"id"`
    UserID          string          `json:"user_id"`
    ShippingAddress string          `json:"shipping_address"`
    Phone           string          `json:"phone"`
    TotalPrice      float64         `json:"total_price"`
    Status          int8            `json:"status"`
    Note            string          `json:"note,omitempty"`
    Items           []*OrderItemDTO  `json:"items,omitempty"`
    CreatedAt       string          `json:"created_at"`
}

func ToOrderDTO(o *models.Order, items []*models.OrderItem) *OrderDTO { ... }
```

## Requests

### order_request.go
```go
// CreateOrderRequest — tạo đơn trực tiếp (không qua cart, hoặc override)
type CreateOrderRequest struct {
    ShippingAddress string `json:"shipping_address"`
    Phone           string `json:"phone"`
    Note            string `json:"note"`
    // Items lấy từ cart của user tại thời điểm đặt hàng
}
func (r CreateOrderRequest) Validate() error {
    // shipping_address required, phone required (length 10-15)
}

type UpdateOrderStatusRequest struct {
    Status int8 `json:"status"`
}
func (r UpdateOrderStatusRequest) Validate() error {
    // status in [1,2,3,4,5,6]
}
```

## Service

### order_service.go
```go
var ErrOrderNotFound   = errors.New("order not found")
var ErrOrderNotOwned   = errors.New("order does not belong to user")
var ErrCartEmpty       = errors.New("cart is empty")
var ErrCannotCancel    = errors.New("order cannot be cancelled in current status")

type OrderService interface {
    CreateFromCart(ctx context.Context, userID string, req *CreateOrderRequest) (*models.Order, []*models.OrderItem, error)
    GetOrder(ctx context.Context, userID string, orderID string, isAdmin bool) (*models.Order, []*models.OrderItem, error)
    ListUserOrders(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
    ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
    UpdateStatus(ctx context.Context, orderID string, status int8) error
    CancelOrder(ctx context.Context, userID, orderID string) error
}
```

**CreateFromCart logic:**
1. `FindOrCreateCart(userID)` → get cart
2. `ListCartItems(cartID)` → verify not empty
3. Calculate `totalPrice` = sum(item.PriceAtAdd * item.Quantity)
4. Create `Order` (status=PENDING, snapshot shipping_address+phone from req)
5. `CreateOrderItems` — snapshot price from cart items
6. `ClearCart(cartID)` — xóa cart sau khi đặt hàng thành công
7. Toàn bộ trong DB transaction

**CancelOrder:** chỉ cho phép nếu status == ORDER_STATUS_PENDING.

**GetOrder:** nếu `isAdmin=false`, verify `order.UserID == userID`.

## Controller

### order_controller.go

```go
func CreateOrder(db *gorm.DB) fiber.Handler { ... }
func ListOrders(db *gorm.DB) fiber.Handler { ... }       // user's own orders
func GetOrder(db *gorm.DB) fiber.Handler { ... }
func CancelOrder(db *gorm.DB) fiber.Handler { ... }
func UpdateOrderStatus(db *gorm.DB) fiber.Handler { ... } // admin
func ListAllOrders(db *gorm.DB) fiber.Handler { ... }     // admin, ?status=&page=&limit=
```

## Route Registration (route.go)

```go
// User order routes
orders := v1.Group("/orders", middleware.JWTAuth(jwtSecret))
orders.Post("/", controllers.CreateOrder(db))
orders.Get("/", controllers.ListOrders(db))
orders.Get("/:id", controllers.GetOrder(db))
orders.Delete("/:id", controllers.CancelOrder(db))

// Admin order routes
adminOrders := v1.Group("/admin/orders",
    middleware.JWTAuth(jwtSecret),
    middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
)
adminOrders.Get("/", controllers.ListAllOrders(db))
adminOrders.Put("/:id/status", controllers.UpdateOrderStatus(db))
```

## Transaction Pattern

```go
err := db.Transaction(func(tx *gorm.DB) error {
    repo := repositories.NewPostgreSQLStorage(tx)
    // ... create order, create items, clear cart
    return nil
})
```

## i18n Keys

```json
"error.order_not_found": "Đơn hàng không tồn tại",
"error.order_not_owned": "Bạn không có quyền xem đơn hàng này",
"error.cart_empty": "Giỏ hàng của bạn đang trống",
"error.cannot_cancel": "Không thể hủy đơn hàng ở trạng thái hiện tại",
"error.invalid_order_status": "Trạng thái đơn hàng không hợp lệ",
"validation.shipping_address.required": "Địa chỉ giao hàng không được để trống",
"validation.phone.required": "Số điện thoại không được để trống"
```

## Todo List

- [ ] Tạo `dto/order_dto.go`
- [ ] Tạo `requests/order_request.go`
- [ ] Tạo `services/order_service.go`
- [ ] Tạo `controllers/order_controller.go` (6 handlers)
- [ ] Cập nhật `initialize/route.go` — thêm order routes
- [ ] Thêm i18n keys vào `vi.json` + `ja.json`
- [ ] Compile check: `cd backend && go build ./...`

## Success Criteria

- POST /api/v1/orders với cart trống → 400 với lỗi cart_empty
- POST /api/v1/orders thành công → order tạo, cart bị clear
- DELETE /api/v1/orders/:id (status != PENDING) → 422 với lỗi cannot_cancel
- PUT /api/v1/admin/orders/:id/status với non-admin → 403
- Toàn bộ create order nằm trong DB transaction

## Risk Assessment

- Transaction rollback nếu ClearCart fail sau CreateOrderItems — cần test
- Price snapshot lúc đặt hàng từ `price_at_add` của cart_item (đúng), không lấy lại từ product
