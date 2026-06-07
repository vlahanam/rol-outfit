# Phase 4: Controller Layer

## Overview
Add refund endpoints and update existing handlers.

**Priority:** High | **Status:** pending | **Effort:** 1h

## Files to Modify

- `backend/src/internal/controllers/order_controller.go`
- `backend/src/internal/requests/order_request.go`
- `backend/src/internal/dto/order_dto.go`
- `backend/src/cmd/main.go` (routes)

## Implementation

### New Request Types

```go
// In requests/order_request.go

type RefundRequest struct {
    Reason string `json:"reason" validate:"max=500"`
}

func (r *RefundRequest) Validate() error {
    return common.Validate.Struct(r)
}

type RejectRefundRequest struct {
    Reason string `json:"reason" validate:"required,min=1,max=500"`
}

func (r *RejectRefundRequest) Validate() error {
    return common.Validate.Struct(r)
}
```

### New DTO for History

```go
// In dto/order_dto.go

type OrderStatusHistoryDTO struct {
    ID         string    `json:"id"`
    FromStatus *int8     `json:"from_status,omitempty"`
    ToStatus   int8      `json:"to_status"`
    ChangedBy  *string   `json:"changed_by,omitempty"`
    Note       string    `json:"note,omitempty"`
    CreatedAt  time.Time `json:"created_at"`
}

func ToOrderStatusHistoryDTO(h *models.OrderStatusHistory) *OrderStatusHistoryDTO {
    return &OrderStatusHistoryDTO{
        ID:         h.ID,
        FromStatus: h.FromStatus,
        ToStatus:   h.ToStatus,
        ChangedBy:  h.ChangedBy,
        Note:       h.Note,
        CreatedAt:  h.CreatedAt,
    }
}
```

### New Controllers

#### User: Request Refund

```go
// POST /api/v1/orders/:id/refund
func RequestRefund(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        userID, err := userIDFromLocals(ctx)
        if err != nil {
            return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
        }
        orderID := ctx.Params("id")

        var req requests.RefundRequest
        if err := ctx.Bind().JSON(&req); err != nil {
            req = requests.RefundRequest{}
        }

        svc := newOrderService(db)
        if err := svc.RequestRefund(ctx.Context(), userID, orderID, req.Reason); err != nil {
            if errors.Is(err, services.ErrOrderNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")))
            }
            if errors.Is(err, services.ErrOrderNotOwned) {
                return ctx.Status(fiber.StatusForbidden).JSON(common.ErrForbidden.WithReason(i18n.T(lang, "error.order_not_owned")))
            }
            if errors.Is(err, services.ErrCannotRequestRefund) {
                return ctx.Status(fiber.StatusConflict).JSON(common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_request_refund")))
            }
            slog.Error("RequestRefund failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.JSON(common.ResponseData(fiber.Map{"message": "Refund requested"}))
    }
}
```

#### Admin: Approve Refund

```go
// PUT /api/v1/admin/orders/:id/approve-refund
func ApproveRefund(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        adminID, _ := userIDFromLocals(ctx)
        orderID := ctx.Params("id")

        svc := newOrderService(db)
        if err := svc.ApproveRefund(ctx.Context(), orderID, adminID); err != nil {
            if errors.Is(err, services.ErrOrderNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")))
            }
            if errors.Is(err, services.ErrNotRefundRequest) {
                return ctx.Status(fiber.StatusConflict).JSON(common.ErrConflict.WithReason(i18n.T(lang, "error.not_refund_request")))
            }
            slog.Error("ApproveRefund failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.SendStatus(fiber.StatusNoContent)
    }
}
```

#### Admin: Reject Refund

```go
// PUT /api/v1/admin/orders/:id/reject-refund
func RejectRefund(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        adminID, _ := userIDFromLocals(ctx)
        orderID := ctx.Params("id")

        var req requests.RejectRefundRequest
        if err := ctx.Bind().JSON(&req); err != nil {
            return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")))
        }
        if err := req.Validate(); err != nil {
            return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed")))
        }

        svc := newOrderService(db)
        if err := svc.RejectRefund(ctx.Context(), orderID, adminID, req.Reason); err != nil {
            if errors.Is(err, services.ErrOrderNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")))
            }
            if errors.Is(err, services.ErrNotRefundRequest) {
                return ctx.Status(fiber.StatusConflict).JSON(common.ErrConflict.WithReason(i18n.T(lang, "error.not_refund_request")))
            }
            slog.Error("RejectRefund failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.SendStatus(fiber.StatusNoContent)
    }
}
```

#### Get Order History

```go
// GET /api/v1/orders/:id/history (user) or /api/v1/admin/orders/:id/history
func GetOrderHistory(db *gorm.DB, isAdmin bool) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        userID, err := userIDFromLocals(ctx)
        if err != nil && !isAdmin {
            return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
        }
        orderID := ctx.Params("id")

        svc := newOrderService(db)
        
        // Verify order access
        order, _, err := svc.GetOrder(ctx.Context(), userID, orderID, isAdmin)
        if err != nil {
            if errors.Is(err, services.ErrOrderNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")))
            }
            if errors.Is(err, services.ErrOrderNotOwned) {
                return ctx.Status(fiber.StatusForbidden).JSON(common.ErrForbidden)
            }
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        
        history, err := svc.GetOrderHistory(ctx.Context(), order.ID)
        if err != nil {
            slog.Error("GetOrderHistory failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        
        result := make([]*dto.OrderStatusHistoryDTO, len(history))
        for i, h := range history {
            result[i] = dto.ToOrderStatusHistoryDTO(h)
        }
        return ctx.JSON(common.ResponseData(result))
    }
}
```

### Update Routes (main.go)

```go
// User routes
orders.Post("/:id/refund", controllers.RequestRefund(db))
orders.Get("/:id/history", controllers.GetOrderHistory(db, false))

// Admin routes
adminOrders.Put("/:id/approve-refund", controllers.ApproveRefund(db))
adminOrders.Put("/:id/reject-refund", controllers.RejectRefund(db))
adminOrders.Get("/:id/history", controllers.GetOrderHistory(db, true))
```

### Update i18n Keys

Add to `backend/src/internal/i18n/messages.go`:

```go
"error.cannot_request_refund": "Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã hoàn thành",
"error.not_refund_request": "Đơn hàng không ở trạng thái chờ duyệt hoàn tiền",
"error.invalid_transition": "Chuyển trạng thái không hợp lệ",
```

## Todo

- [ ] Add request types
- [ ] Add history DTO
- [ ] Implement RequestRefund controller
- [ ] Implement ApproveRefund controller
- [ ] Implement RejectRefund controller
- [ ] Implement GetOrderHistory controller
- [ ] Register routes
- [ ] Add i18n messages
- [ ] Test all endpoints

## Success Criteria

- POST /orders/:id/refund works for COMPLETED orders
- Admin can approve/reject refunds
- History endpoint returns ordered list
- Proper error responses for invalid states
