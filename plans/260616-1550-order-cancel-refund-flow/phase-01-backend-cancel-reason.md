# Phase 1: Backend - Cancel with Reason

## Overview

Modify cancel order endpoint to accept optional reason, validate required for status 2,3.

## Files to Modify

### 1. `backend/src/internal/requests/order_requests.go`

Add request struct:
```go
type CancelOrderRequest struct {
    Reason string `json:"reason"`
}
```

### 2. `backend/src/internal/controllers/order_controller.go`

Update `CancelOrder` handler:
```go
func CancelOrder(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        // ... existing auth code ...
        
        var req requests.CancelOrderRequest
        if err := ctx.BodyParser(&req); err != nil && ctx.Body() != nil && len(ctx.Body()) > 0 {
            return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest)
        }
        
        svc := newOrderService(db)
        if err := svc.CancelOrder(ctx.Context(), userID, orderID, req.Reason, false); err != nil {
            // ... handle errors including new ErrReasonRequired ...
        }
        return ctx.SendStatus(fiber.StatusNoContent)
    }
}
```

### 3. `backend/src/internal/services/order_service.go`

Update service:
```go
var ErrReasonRequired = errors.New("cancellation reason is required")

func (s *orderService) CancelOrder(ctx context.Context, userID, orderID, reason string, isAdmin bool) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    // ... existing validation ...
    
    // Require reason for status 2 (PAYMENT_SUBMITTED) or 3 (CONFIRMED)
    if order.Status == models.ORDER_STATUS_PAYMENT_SUBMITTED || 
       order.Status == models.ORDER_STATUS_CONFIRMED {
        if strings.TrimSpace(reason) == "" {
            return ErrReasonRequired
        }
    }
    
    note := "Order cancelled"
    if reason != "" {
        note = reason
    }
    
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, userID, note)
}
```

### 4. `backend/src/internal/i18n/messages.go`

Add translation:
```go
"error.reason_required": {
    "vi": "Vui lòng nhập lý do hủy đơn",
    "en": "Please provide a cancellation reason",
}
```

## Todo

- [ ] Add CancelOrderRequest struct
- [ ] Update CancelOrder controller to parse body
- [ ] Add ErrReasonRequired error
- [ ] Update CancelOrder service with reason validation
- [ ] Add i18n message
- [ ] Test: status 1 cancel without reason → success
- [ ] Test: status 2,3 cancel without reason → error
- [ ] Test: status 2,3 cancel with reason → success
