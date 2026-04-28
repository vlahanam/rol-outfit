---
title: Cart CRUD
status: completed
priority: high
phase: 5
completed: 2026-04-28
---

# Phase 5: Cart CRUD

## Overview

Implement Cart + CartItem endpoints (GET, POST, PUT, DELETE) with services, controllers, requests, and DTOs.

## Context Links

- Models: `backend/src/internal/models/cart.go`
- Repositories: `backend/src/internal/repositories/cart_repo.go`

## Architecture

```
GET    /api/v1/cart                → CartController.GetCart()     (user, returns cart + items)
POST   /api/v1/cart/items          → CartController.AddItem()     (user, add to cart)
PUT    /api/v1/cart/items/:itemID  → CartController.UpdateItem()  (user, update quantity)
DELETE /api/v1/cart/items/:itemID  → CartController.RemoveItem()  (user, delete item)
```

## Key Insights

- Cart created automatically on first item add if doesn't exist
- GetCart returns Cart with nested CartItems (use LEFT JOIN or load separately)
- AddItem must check product exists and is ACTIVE before adding
- UpdateItem validates item exists and belongs to user's cart
- RemoveItem soft or hard deletes (CartItem has no deleted_at, so hard delete)
- All cart operations scoped to authenticated user (JWT.sub)

## Related Code Files

**Create:**
- `backend/src/internal/services/cart_service.go`
- `backend/src/internal/controllers/cart_controller.go`
- `backend/src/internal/requests/cart_request.go`
- `backend/src/internal/dto/cart_dto.go`

**Modify:**
- `backend/src/internal/initialize/route.go` — register cart routes

## Implementation Steps

### Services (CartService)

- GetOrCreateCart(ctx, userID) → *Cart
- AddToCart(ctx, userID, productID, attrID, quantity) → *CartItem (checks product active)
- UpdateItem(ctx, itemID, userID, quantity) → error (scope check)
- RemoveItem(ctx, itemID, userID) → error (scope check)

### Controllers

- GetCart(db): parse JWT.sub, call service, return cart+items DTO
- AddItem(db): parse request, call service, return CartItem DTO
- UpdateItem(db): parse itemID + quantity, call service
- RemoveItem(db): parse itemID, call service

### Requests

- AddItemRequest: ProductID, AttrID, Quantity (all required, Quantity > 0)
- UpdateItemRequest: Quantity (required, > 0)

### DTOs

- CartDTO: ID, UserID, Items []*CartItemDTO
- CartItemDTO: ID, CartID, ProductID, AttrID, PriceAtAdd, Quantity, CreatedAt, UpdatedAt

### Route Registration

```go
cart := v1.Group("/cart")
cart.Use(JWTAuth)  // require JWT

cart.Get("", CartController.GetCart(db))
cart.Post("/items", CartController.AddItem(db))
cart.Put("/items/:itemID", CartController.UpdateItem(db))
cart.Delete("/items/:itemID", CartController.RemoveItem(db))
```

## Todo List

- [x] Tạo `services/cart_service.go`
- [x] Tạo `controllers/cart_controller.go`
- [x] Tạo `requests/cart_request.go`
- [x] Tạo `dto/cart_dto.go`
- [x] Đăng ký routes trong `route.go`
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- GetCart returns authenticated user's cart with all items
- AddItem creates cart if missing, adds item with correct price
- UpdateItem updates quantity only (price immutable)
- RemoveItem deletes item immediately
- All operations check userID from JWT
- Pagination not needed (assume cart < 100 items)
- Error responses consistent

## Next Steps

- Phase 6: Order CRUD
