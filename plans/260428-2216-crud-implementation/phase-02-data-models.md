---
title: Data Models
status: completed
priority: high
phase: 2
completed: 2026-04-28
---

# Phase 2: Data Models

## Overview

Tạo GORM model structs cho 6 bảng còn lại từ migrations. Mỗi model một file riêng, ≤ 60 lines.

## Context Links

- Existing model: `backend/src/internal/models/user.go`
- Migrations: `backend/database/migrations/`

## Related Code Files

**Create:**
- `backend/src/internal/models/category.go`
- `backend/src/internal/models/product.go`
- `backend/src/internal/models/cart.go`
- `backend/src/internal/models/order.go`

## Implementation Steps

### category.go

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

const (
    CATEGORY_STATUS_ACTIVE = int8(1)
    CATEGORY_STATUS_HIDDEN = int8(2)
)

type Category struct {
    ID          string         `gorm:"type:uuid;primaryKey"`
    Name        string         `gorm:"column:name"`
    Slug        string         `gorm:"column:slug"`
    Status      int8           `gorm:"column:status"`
    Description string         `gorm:"column:description"`
    CreatedAt   time.Time      `gorm:"column:created_at"`
    UpdatedAt   time.Time      `gorm:"column:updated_at"`
    DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Category) TableName() string { return "categories" }
```

### product.go

```go
package models

import (
    "encoding/json"
    "time"
    "gorm.io/gorm"
)

const (
    PRODUCT_STATUS_ACTIVE = int8(1)
    PRODUCT_STATUS_HIDDEN = int8(2)
)

type Product struct {
    ID           string              `gorm:"type:uuid;primaryKey"`
    CategoryID   string              `gorm:"column:category_id;type:uuid"`
    Name         string              `gorm:"column:name"`
    Slug         string              `gorm:"column:slug"`
    DefaultPrice float64             `gorm:"column:default_price;type:numeric(12,2)"`
    Description  string              `gorm:"column:description"`
    Status       int8                `gorm:"column:status"`
    Data         json.RawMessage     `gorm:"column:data;type:jsonb"`
    CreatedAt    time.Time           `gorm:"column:created_at"`
    UpdatedAt    time.Time           `gorm:"column:updated_at"`
    DeletedAt    gorm.DeletedAt      `gorm:"column:deleted_at;index"`
}

func (Product) TableName() string { return "products" }
```

### cart.go — Cart + CartItem

```go
package models

import "time"

type Cart struct {
    ID        string    `gorm:"type:uuid;primaryKey"`
    UserID    string    `gorm:"column:user_id;type:uuid"`
    CreatedAt time.Time `gorm:"column:created_at"`
}

func (Cart) TableName() string { return "carts" }

type CartItem struct {
    ID         string    `gorm:"type:uuid;primaryKey"`
    CartID     string    `gorm:"column:cart_id;type:uuid"`
    ProductID  string    `gorm:"column:product_id;type:uuid"`
    AttrID     string    `gorm:"column:attr_id;type:uuid"`
    PriceAtAdd float64   `gorm:"column:price_at_add;type:numeric(12,2)"`
    Quantity   int       `gorm:"column:quantity"`
    CreatedAt  time.Time `gorm:"column:created_at"`
    UpdatedAt  time.Time `gorm:"column:updated_at"`
}

func (CartItem) TableName() string { return "cart_item" }
```

### order.go — Order + OrderItem

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

const (
    ORDER_STATUS_PENDING   = int8(1)
    ORDER_STATUS_CONFIRMED = int8(2)
    ORDER_STATUS_SHIPPING  = int8(3)
    ORDER_STATUS_DELIVERED = int8(4)
    ORDER_STATUS_PAID      = int8(5)
    ORDER_STATUS_CANCELLED = int8(6)
)

type Order struct {
    ID              string         `gorm:"type:uuid;primaryKey"`
    UserID          string         `gorm:"column:user_id;type:uuid"`
    ShippingAddress string         `gorm:"column:shipping_address"`
    Phone           string         `gorm:"column:phone"`
    TotalPrice      float64        `gorm:"column:total_price;type:numeric(12,2)"`
    Status          int8           `gorm:"column:status"`
    Note            string         `gorm:"column:note"`
    CreatedAt       time.Time      `gorm:"column:created_at"`
    UpdatedAt       time.Time      `gorm:"column:updated_at"`
    DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
    ID        string    `gorm:"type:uuid;primaryKey"`
    OrderID   string    `gorm:"column:order_id;type:uuid"`
    ProductID string    `gorm:"column:product_id;type:uuid"`
    AttrID    string    `gorm:"column:attr_id;type:uuid"`
    Price     float64   `gorm:"column:price;type:numeric(12,2)"`
    Quantity  int       `gorm:"column:quantity"`
    CreatedAt time.Time `gorm:"column:created_at"`
    UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (OrderItem) TableName() string { return "order_item" }
```

## Todo List

- [x] Tạo `models/category.go`
- [x] Tạo `models/product.go`
- [x] Tạo `models/cart.go` (Cart + CartItem)
- [x] Tạo `models/order.go` (Order + OrderItem)
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- `go build ./...` passes
- Tất cả TableName() khớp với tên bảng trong migrations
- `json.RawMessage` cho JSONB field của Product
