---
title: Repositories
status: completed
priority: high
phase: 3
completed: 2026-04-28
---

# Phase 3: Repositories

## Overview

Thêm interface + PostgreSQL implementation cho Category, Product, Cart/CartItem, Order/OrderItem. Tất cả đều implement trên `postgreStorage` struct hiện có — chỉ cần thêm methods vào các file mới trong cùng package `repositories`.

## Context Links

- Base struct: `backend/src/internal/repositories/gorm.go`
- Pattern: `backend/src/internal/repositories/user_repo.go`

## Architecture

```
postgreStorage (gorm.go)
  ├── user_repo.go     → UserRepository interface + methods
  ├── category_repo.go → CategoryRepository interface + methods   (NEW)
  ├── product_repo.go  → ProductRepository interface + methods    (NEW)
  ├── cart_repo.go     → CartRepository + CartItemRepository      (NEW)
  └── order_repo.go    → OrderRepository + OrderItemRepository    (NEW)
```

Mỗi file export interface, *postgreStorage tự động satisfy nhờ method set.

## Related Code Files

**Create:**
- `backend/src/internal/repositories/category_repo.go`
- `backend/src/internal/repositories/product_repo.go`
- `backend/src/internal/repositories/cart_repo.go`
- `backend/src/internal/repositories/order_repo.go`

## Implementation Steps

### category_repo.go

```go
package repositories

import (
    "context"
    "errors"
    "fmt"
    "github.com/vlahanam/rol-outfit/src/internal/models"
    "gorm.io/gorm"
)

type CategoryRepository interface {
    CreateCategory(ctx context.Context, c *models.Category) error
    FindCategoryByID(ctx context.Context, id string) (*models.Category, error)
    FindCategoryBySlug(ctx context.Context, slug string) (*models.Category, error)
    ListCategories(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
    UpdateCategory(ctx context.Context, id string, fields map[string]interface{}) error
    SoftDeleteCategory(ctx context.Context, id string) error
}

func (r *postgreStorage) CreateCategory(ctx context.Context, c *models.Category) error { ... }
func (r *postgreStorage) FindCategoryByID(...) ...
func (r *postgreStorage) FindCategoryBySlug(...) ...
func (r *postgreStorage) ListCategories(...) ...
func (r *postgreStorage) UpdateCategory(...) ...
func (r *postgreStorage) SoftDeleteCategory(...) ...
```

**Query patterns** (follow user_repo.go):
- FindByID/Slug: `WHERE id/slug = ? AND deleted_at IS NULL` + `errors.Is(gorm.ErrRecordNotFound)`
- List: `WHERE deleted_at IS NULL` + count + offset/limit + `ORDER BY created_at DESC`
- Update: `Model(&Category{}).Where("id = ? AND deleted_at IS NULL", id).Updates(fields)`
- SoftDelete: `Update("deleted_at", time.Now())`

### product_repo.go

```go
type ProductRepository interface {
    CreateProduct(ctx context.Context, p *models.Product) error
    FindProductByID(ctx context.Context, id string) (*models.Product, error)
    FindProductBySlug(ctx context.Context, slug string) (*models.Product, error)
    ListProducts(ctx context.Context, categoryID string, offset, limit int) ([]*models.Product, int64, error)
    UpdateProduct(ctx context.Context, id string, fields map[string]interface{}) error
    SoftDeleteProduct(ctx context.Context, id string) error
}
```

ListProducts: nếu `categoryID != ""` thêm `AND category_id = ?`.

### cart_repo.go

```go
type CartRepository interface {
    FindOrCreateCart(ctx context.Context, userID string) (*models.Cart, error)
    FindCartByUserID(ctx context.Context, userID string) (*models.Cart, error)
}

type CartItemRepository interface {
    CreateCartItem(ctx context.Context, item *models.CartItem) error
    FindCartItem(ctx context.Context, cartID, productID, attrID string) (*models.CartItem, error)
    FindCartItemByID(ctx context.Context, id string) (*models.CartItem, error)
    ListCartItems(ctx context.Context, cartID string) ([]*models.CartItem, error)
    UpdateCartItem(ctx context.Context, id string, fields map[string]interface{}) error
    DeleteCartItem(ctx context.Context, id string) error
    ClearCart(ctx context.Context, cartID string) error
}
```

FindOrCreateCart: `FirstOrCreate` với `user_id`.

### order_repo.go

```go
type OrderRepository interface {
    CreateOrder(ctx context.Context, order *models.Order) error
    FindOrderByID(ctx context.Context, id string) (*models.Order, error)
    ListOrdersByUser(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
    ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
    UpdateOrder(ctx context.Context, id string, fields map[string]interface{}) error
    SoftDeleteOrder(ctx context.Context, id string) error
}

type OrderItemRepository interface {
    CreateOrderItems(ctx context.Context, items []*models.OrderItem) error
    ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error)
}
```

ListAllOrders: nếu `status > 0` thêm `AND status = ?`.

## Todo List

- [x] Tạo `repositories/category_repo.go` — interface + 6 methods
- [x] Tạo `repositories/product_repo.go` — interface + 6 methods
- [x] Tạo `repositories/cart_repo.go` — CartRepository + CartItemRepository + methods
- [x] Tạo `repositories/order_repo.go` — OrderRepository + OrderItemRepository + methods
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- `go build ./...` passes
- Mỗi method wrap error với `fmt.Errorf("failed to ...: %w", err)`
- Không dùng GORM Auto-migrations — schema đã có từ SQL migrations
