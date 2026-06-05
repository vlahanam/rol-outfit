# Phase 3: Backend New Endpoint

**Status:** pending | **Effort:** 45m | **Priority:** high

## Overview

Create new endpoint for user to mark order as transferred.

## Files to Modify

- `backend/src/internal/controllers/order_controller.go` - Add handler
- `backend/src/internal/services/order_service.go` - Add service method
- `backend/src/internal/initialize/route.go` - Register route

## API Design

```
PUT /api/v1/orders/:id/mark-transferred
Authorization: Bearer {jwt}
Response: { "message": "Order marked as transferred" }
```

**Validations:**
- User must own the order
- Order status must be AWAITING_PAYMENT (7)
- Idempotent: if already PAYMENT_SUBMITTED, return success

## Implementation Steps

### 1. Add Service Method

In `order_service.go`:

```go
func (s *OrderService) MarkAsTransferred(userID, orderID string) error {
    order, err := s.repo.FindByID(orderID)
    if err != nil {
        return err
    }
    
    // Validate ownership
    if order.UserID != userID {
        return errors.New("order not found")
    }
    
    // Idempotent check
    if order.Status == models.ORDER_STATUS_PAYMENT_SUBMITTED {
        return nil
    }
    
    // Validate status
    if order.Status != models.ORDER_STATUS_AWAITING_PAYMENT {
        return errors.New("order is not awaiting payment")
    }
    
    return s.repo.UpdateStatus(orderID, models.ORDER_STATUS_PAYMENT_SUBMITTED)
}
```

### 2. Add Controller Handler

In `order_controller.go`:

```go
func MarkOrderTransferred(db *gorm.DB) fiber.Handler {
    return func(c fiber.Ctx) error {
        userID := c.Locals("userID").(string)
        orderID := c.Params("id")
        
        service := services.NewOrderService(db)
        if err := service.MarkAsTransferred(userID, orderID); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": err.Error(),
            })
        }
        
        return c.JSON(fiber.Map{
            "message": "Order marked as transferred",
        })
    }
}
```

### 3. Register Route

In `route.go`, add under user orders group:

```go
orders.Put("/:id/mark-transferred", controllers.MarkOrderTransferred(db))
```

## Todo

- [ ] Add MarkAsTransferred to order service
- [ ] Add MarkOrderTransferred controller handler
- [ ] Register PUT route
- [ ] Test endpoint manually with curl/Postman

## Success Criteria

- Endpoint returns 200 for valid AWAITING_PAYMENT order
- Returns 400 for wrong status
- Returns 400 for non-owner
- Idempotent for already PAYMENT_SUBMITTED orders
