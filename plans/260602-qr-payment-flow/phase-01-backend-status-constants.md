# Phase 1: Backend Status Constants

**Status:** pending | **Effort:** 15m | **Priority:** high

## Overview

Add two new order status constants for the payment flow.

## Files to Modify

- `backend/src/internal/models/order.go` - Add constants
- `backend/src/internal/dto/order_dto.go` - Add status label mapping (if exists)

## Implementation Steps

### 1. Add Status Constants

In `order.go`, add after existing constants:

```go
const (
    ORDER_STATUS_PENDING          = int8(1)
    ORDER_STATUS_CONFIRMED        = int8(2)
    ORDER_STATUS_SHIPPING         = int8(3)
    ORDER_STATUS_DELIVERED        = int8(4)
    ORDER_STATUS_PAID             = int8(5)
    ORDER_STATUS_CANCELLED        = int8(6)
    ORDER_STATUS_AWAITING_PAYMENT = int8(7)  // NEW: Chờ chuyển khoản
    ORDER_STATUS_PAYMENT_SUBMITTED = int8(8) // NEW: Đã báo CK, chờ verify
)
```

### 2. Update DTO (if status labels exist)

Check if `order_dto.go` has status label mapping. If yes, add:
- 7: "awaiting_payment" / "Chờ chuyển khoản"
- 8: "payment_submitted" / "Đã báo chuyển khoản"

## Todo

- [ ] Add ORDER_STATUS_AWAITING_PAYMENT constant
- [ ] Add ORDER_STATUS_PAYMENT_SUBMITTED constant
- [ ] Update DTO status mapping if exists
- [ ] Run `go build ./...` to verify compilation

## Success Criteria

- Constants compile without errors
- Values don't conflict with existing statuses (1-6)
