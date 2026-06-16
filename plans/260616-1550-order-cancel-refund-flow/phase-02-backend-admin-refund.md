# Phase 2: Backend - Admin Refund Cancelled Orders

## Overview

Add transition 6→8 and admin endpoint to refund cancelled orders.

## Files to Modify

### 1. `backend/src/internal/models/order.go`

Add transition:
```go
var ValidOrderTransitions = map[int8][]int8{
    // ... existing transitions ...
    ORDER_STATUS_CANCELLED:        {ORDER_STATUS_REFUNDED},  // NEW: 6→8
    ORDER_STATUS_REFUND_REQUESTED: {ORDER_STATUS_REFUNDED, ORDER_STATUS_COMPLETED},
}
```

### 2. `backend/src/internal/services/order_service.go`

Add service method:
```go
func (s *orderService) RefundCancelledOrder(ctx context.Context, orderID, adminID string) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    if err != nil {
        return fmt.Errorf("failed to find order: %w", err)
    }
    if order == nil {
        return ErrOrderNotFound
    }
    if order.Status != models.ORDER_STATUS_CANCELLED {
        return ErrInvalidTransition
    }
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUNDED, adminID, "Refunded cancelled order")
}
```

### 3. `backend/src/internal/controllers/admin_order_controller.go`

Add handler:
```go
func AdminRefundCancelledOrder(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        adminID, _ := userIDFromLocals(ctx)
        orderID := ctx.Params("id")

        svc := newOrderService(db)
        if err := svc.RefundCancelledOrder(ctx.Context(), orderID, adminID); err != nil {
            if errors.Is(err, services.ErrOrderNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(
                    common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
                )
            }
            if errors.Is(err, services.ErrInvalidTransition) {
                return ctx.Status(fiber.StatusConflict).JSON(
                    common.ErrConflict.WithReason(i18n.T(lang, "error.invalid_status_transition")),
                )
            }
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.JSON(fiber.Map{"message": "Order refunded successfully"})
    }
}
```

### 4. `backend/src/internal/routes/routes.go`

Add route:
```go
adminOrders.Put("/:id/refund-cancelled", controllers.AdminRefundCancelledOrder(db))
```

## Todo

- [ ] Add transition 6→8 to ValidOrderTransitions
- [ ] Add RefundCancelledOrder service method
- [ ] Add AdminRefundCancelledOrder controller
- [ ] Register route
- [ ] Test: refund cancelled order → success
- [ ] Test: refund non-cancelled order → error
