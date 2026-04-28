---
title: Order CRUD
status: completed
priority: high
phase: 6
completed: 2026-04-28
---

# Phase 6: Order CRUD

## Overview

Implement Order + OrderItem endpoints with services, controllers, requests, DTOs, and transaction-based order creation.

## Context Links

- Models: `backend/src/internal/models/order.go`
- Repositories: `backend/src/internal/repositories/order_repo.go`
- Cart: `backend/src/internal/models/cart.go`

## Architecture

```
GET    /api/v1/orders                → OrderController.List()        (user=own, admin=all, paginated)
GET    /api/v1/orders/:id            → OrderController.Get()         (user=own, admin=any)
POST   /api/v1/orders                → OrderController.Create()      (user, from cart)
PUT    /api/v1/orders/:id/status     → OrderController.UpdateStatus() (admin only)
DELETE /api/v1/orders/:id            → OrderController.Delete()      (user=own cancel, soft delete)
```

## Key Insights

- CreateOrder runs inside transaction: validate cart has items → copy CartItems to OrderItems → clear cart → set order status=PENDING
- ListOrders: user sees own only (WHERE user_id = ?), admin sees all or filter by status
- Get: user can only get own order, admin can get any
- UpdateStatus: admin only, updates status field
- Delete: soft delete, user can only cancel if status=PENDING, admin can cancel any
- OrderItem stores price snapshot at order time (immutable), CartItem is mutable

## Related Code Files

**Create:**
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/controllers/order_controller.go`
- `backend/src/internal/requests/order_request.go`
- `backend/src/internal/dto/order_dto.go`

**Modify:**
- `backend/src/internal/initialize/route.go` — register order routes

## Implementation Steps

### Services (OrderService)

- CreateOrder(ctx, userID, shippingAddress, phone, note) → *Order (transaction, validates cart)
  - Fetch cart with items
  - Validate cart has items
  - Create order with status=PENDING, total_price=sum(item.price * item.quantity)
  - Copy cart items to order items (snapshot price)
  - Clear cart items
  - Return order
  
- GetOrder(ctx, userID, orderID, isAdmin) → *Order (access control)
  - If user=false: WHERE user_id = ?
  - If user=true (admin): no filter

- ListOrders(ctx, userID, isAdmin, status, offset, limit) → []*Order, total, error
  - If user=false: WHERE user_id = ? (+ status filter if status > 0)
  - If user=true (admin): (+ status filter if status > 0)

- UpdateOrderStatus(ctx, orderID, status) → error (admin only)

- CancelOrder(ctx, userID, orderID, isAdmin) → error
  - If user=false: soft delete only if status=PENDING, WHERE user_id = ?
  - If user=true (admin): soft delete regardless of status

### Controllers

- List(db): parse query (status, offset, limit), auth from JWT, call service with isAdmin flag
- Get(db): parse orderID, auth from JWT, call service with isAdmin flag
- Create(db): parse request (address, phone, note), auth from JWT, call service, copy cart items to DTO
- UpdateStatus(db): parse orderID + new status, admin only, call service
- Delete(db): parse orderID, auth from JWT, call service

### Requests

- CreateOrderRequest: ShippingAddress, Phone, Note (all required, address min 10 chars, phone regex)
- UpdateStatusRequest: Status (required, valid enum value)

### DTOs

- OrderDTO: ID, UserID, ShippingAddress, Phone, TotalPrice, Status, Note, Items []*OrderItemDTO, CreatedAt, UpdatedAt
- OrderItemDTO: ID, OrderID, ProductID, AttrID, Price, Quantity, CreatedAt, UpdatedAt

### Route Registration

```go
orders := v1.Group("/orders")
orders.Use(JWTAuth)  // require JWT

orders.Get("", OrderController.List(db))
orders.Post("", OrderController.Create(db))
orders.Get("/:id", OrderController.Get(db))
orders.Put("/:id/status", RequireRole(ADMIN), OrderController.UpdateStatus(db))
orders.Delete("/:id", OrderController.Delete(db))
```

## Todo List

- [x] Tạo `services/order_service.go` với transaction support
- [x] Tạo `controllers/order_controller.go`
- [x] Tạo `requests/order_request.go` với validation
- [x] Tạo `dto/order_dto.go`
- [x] Đăng ký routes trong `route.go`
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- CreateOrder runs in transaction (all-or-nothing)
- User sees own orders only, admin sees all
- Get/Delete enforces user scope (user cannot access other users' orders)
- UpdateStatus admin-only
- Soft delete preserves data for accounting
- Pagination works correctly
- OrderItems snapshot prices correctly
- Cart cleared after order creation
- Error responses consistent

## Blockers / Risks

- None identified

## Next Steps

- Testing: Integration tests for all CRUD flows
- Documentation: Update API docs with order/cart endpoints
