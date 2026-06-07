# Phase 2: Backend Models

## Overview
Update order status constants and add OrderStatusHistory model.

**Priority:** High | **Status:** pending | **Effort:** 0.5h

## Files to Modify

- `backend/src/internal/models/order.go`

## Implementation

### Update Status Constants

Replace existing constants with clean values:

```go
const (
    ORDER_STATUS_AWAITING_PAYMENT  = int8(1) // Chờ chuyển khoản
    ORDER_STATUS_PAYMENT_SUBMITTED = int8(2) // Đã báo CK
    ORDER_STATUS_CONFIRMED         = int8(3) // Xác nhận thành công
    ORDER_STATUS_SHIPPING          = int8(4) // Đang giao
    ORDER_STATUS_COMPLETED         = int8(5) // Hoàn thành
    ORDER_STATUS_CANCELLED         = int8(6) // Đã hủy
    ORDER_STATUS_REFUND_REQUESTED  = int8(7) // Yêu cầu hoàn tiền
    ORDER_STATUS_REFUNDED          = int8(8) // Đã hoàn tiền
)
```

### Add Transition Map

```go
var ValidOrderTransitions = map[int8][]int8{
    ORDER_STATUS_AWAITING_PAYMENT:  {ORDER_STATUS_PAYMENT_SUBMITTED, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_PAYMENT_SUBMITTED: {ORDER_STATUS_CONFIRMED, ORDER_STATUS_AWAITING_PAYMENT, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_CONFIRMED:         {ORDER_STATUS_SHIPPING, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_SHIPPING:          {ORDER_STATUS_COMPLETED},
    ORDER_STATUS_COMPLETED:         {ORDER_STATUS_REFUND_REQUESTED},
    ORDER_STATUS_REFUND_REQUESTED:  {ORDER_STATUS_REFUNDED, ORDER_STATUS_COMPLETED},
}

func IsValidTransition(from, to int8) bool {
    allowed, exists := ValidOrderTransitions[from]
    if !exists {
        return false
    }
    for _, s := range allowed {
        if s == to {
            return true
        }
    }
    return false
}
```

### Add History Model

```go
type OrderStatusHistory struct {
    ID        string    `gorm:"type:uuid;primaryKey"`
    OrderID   string    `gorm:"column:order_id;type:uuid;not null"`
    FromStatus *int8    `gorm:"column:from_status"`
    ToStatus  int8      `gorm:"column:to_status;not null"`
    ChangedBy *string   `gorm:"column:changed_by;type:uuid"`
    Note      string    `gorm:"column:note"`
    CreatedAt time.Time `gorm:"column:created_at"`
}

func (OrderStatusHistory) TableName() string { return "order_status_history" }
```

## Todo

- [ ] Update ORDER_STATUS constants (remove PENDING, PAID, DELIVERED)
- [ ] Add ValidOrderTransitions map
- [ ] Add IsValidTransition helper
- [ ] Add OrderStatusHistory struct
- [ ] Run `go build ./...` to verify compilation

## Success Criteria

- Status constants match database comments
- Transition validation logic in place
- History model ready for repository layer
