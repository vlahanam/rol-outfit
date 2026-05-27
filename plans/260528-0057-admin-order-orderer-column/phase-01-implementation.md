---
phase: 1
title: Backend + Frontend Implementation
status: complete
priority: high
---

# Phase 1: Backend + Frontend Implementation

## Overview

Add orderer info to admin orders API response and display in frontend.

## Architecture

```
Backend Changes:
┌─────────────────────────────────────────────────────────────┐
│ OrderDTO (existing)                                         │
│   └── AdminOrderDTO (new) adds: user_name, user_email      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ListAllOrders controller                                    │
│   - Collect unique user IDs from orders                     │
│   - Batch fetch users                                       │
│   - Map user info to AdminOrderDTO                          │
└─────────────────────────────────────────────────────────────┘

Frontend Changes:
┌─────────────────────────────────────────────────────────────┐
│ /admin/orders page                                          │
│   - Add "Người đặt" column after "Mã ĐH"                   │
│   - Display: name (bold), email, phone                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ /admin/orders/[id] page                                     │
│   - Update "Khách Hàng" section                             │
│   - Show: name, email, phone (already has phone)            │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Backend: Add AdminOrderDTO

File: `backend/src/internal/dto/order_dto.go`

Add new struct:
```go
type AdminOrderDTO struct {
    *OrderDTO
    UserName  string `json:"user_name"`
    UserEmail string `json:"user_email"`
}

func ToAdminOrderDTO(o *models.Order, items []*models.OrderItem, user *models.User) *AdminOrderDTO {
    dto := &AdminOrderDTO{
        OrderDTO: ToOrderDTO(o, items),
    }
    if user != nil {
        dto.UserName = user.FullName
        dto.UserEmail = user.Email
    }
    return dto
}
```

### 2. Backend: Update ListAllOrders Controller

File: `backend/src/internal/controllers/order_controller.go`

Modify `ListAllOrders` to:
1. Get orders as usual
2. Collect unique user IDs
3. Batch fetch users by IDs
4. Build AdminOrderDTO with user info

### 3. Backend: Add GetOrderAdmin Handler

File: `backend/src/internal/controllers/order_controller.go`

Add new handler for admin order detail that includes user info.

### 4. Frontend: Update Order Type

File: `frontend/types/api.ts`

Add optional user fields to Order interface:
```typescript
export interface Order {
  // ... existing fields
  user_name?: string;
  user_email?: string;
}
```

### 5. Frontend: Update Orders List Page

File: `frontend/app/admin/(protected)/orders/page.tsx`

Add "Người đặt" column:
- Position: after "Mã ĐH" column
- Content: Name (bold), email on new line, phone on new line
- Search: also search by name/email

### 6. Frontend: Update Order Detail Page

File: `frontend/app/admin/(protected)/orders/[id]/page.tsx`

Update "Khách Hàng" section:
- Show: Tên (full_name), Email, Số ĐT (already exists)

## Todo List

- [x] Add AdminOrderDTO to order_dto.go
- [x] Add ToAdminOrderDTO function
- [x] Update ListAllOrders to return AdminOrderDTO with user info
- [x] Add GetOrderAdmin handler for detail page
- [x] Add route for admin order detail
- [x] Update Order interface in api.ts
- [x] Add orderer column to orders list page
- [x] Update order detail page customer section
- [x] Test backend compiles
- [x] Test frontend builds

## Success Criteria

- Admin orders list shows: Mã ĐH | Người đặt | Địa chỉ giao | Tổng Tiền | Trạng Thái | Ngày Đặt | Hành Động
- Người đặt column displays name, email, phone in stacked format
- Order detail shows full user info in Khách Hàng section
- Search works for name/email
