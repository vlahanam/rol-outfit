# Phase 1: Backend Status & Stock

## Overview

- **Priority:** High
- **Status:** Complete
- **Effort:** 1.5h

Add SHIPPING→CANCELLED transition and implement automatic stock management.

## Files to Modify

| File | Action |
|------|--------|
| `backend/src/internal/models/order.go` | Update ValidOrderTransitions |
| `backend/src/internal/repositories/product_variant_repo.go` | Add stock methods |
| `backend/src/internal/services/order_service.go` | Add stock logic to UpdateStatus |
| `backend/src/internal/services/order_service_test.go` | Add tests |

## Implementation Steps

### Step 1: Update ValidOrderTransitions

**File:** `backend/src/internal/models/order.go:20-28`

```go
var ValidOrderTransitions = map[int8][]int8{
    ORDER_STATUS_AWAITING_PAYMENT:  {ORDER_STATUS_PAYMENT_SUBMITTED, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_PAYMENT_SUBMITTED: {ORDER_STATUS_CONFIRMED, ORDER_STATUS_AWAITING_PAYMENT, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_CONFIRMED:         {ORDER_STATUS_SHIPPING, ORDER_STATUS_CANCELLED},
    ORDER_STATUS_SHIPPING:          {ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED},  // ADD CANCELLED
    ORDER_STATUS_COMPLETED:         {ORDER_STATUS_REFUND_REQUESTED},
    ORDER_STATUS_CANCELLED:         {ORDER_STATUS_REFUNDED},
    ORDER_STATUS_REFUND_REQUESTED:  {ORDER_STATUS_REFUNDED, ORDER_STATUS_COMPLETED},
}
```

### Step 2: Add Stock Repository Methods

**File:** `backend/src/internal/repositories/product_variant_repo.go`

Add to interface:
```go
type ProductVariantRepository interface {
    // existing methods...
    DeductStock(ctx context.Context, variantID string, quantity int) error
    RestoreStock(ctx context.Context, variantID string, quantity int) error
}
```

Add implementations:
```go
func (r *postgreStorage) DeductStock(ctx context.Context, variantID string, quantity int) error {
    result := r.db.WithContext(ctx).
        Model(&models.ProductVariant{}).
        Where("id = ? AND stock >= ?", variantID, quantity).
        Updates(map[string]interface{}{
            "stock": gorm.Expr("stock - ?", quantity),
            "sold":  gorm.Expr("sold + ?", quantity),
        })
    if result.Error != nil {
        return fmt.Errorf("failed to deduct stock: %w", result.Error)
    }
    if result.RowsAffected == 0 {
        return fmt.Errorf("insufficient stock or variant not found")
    }
    return nil
}

func (r *postgreStorage) RestoreStock(ctx context.Context, variantID string, quantity int) error {
    result := r.db.WithContext(ctx).
        Model(&models.ProductVariant{}).
        Where("id = ?", variantID).
        Updates(map[string]interface{}{
            "stock": gorm.Expr("stock + ?", quantity),
            "sold":  gorm.Expr("GREATEST(sold - ?, 0)", quantity),
        })
    if result.Error != nil {
        return fmt.Errorf("failed to restore stock: %w", result.Error)
    }
    return nil
}
```

### Step 3: Add variantRepo to OrderService

**File:** `backend/src/internal/services/order_service.go`

Update struct:
```go
type orderService struct {
    db            *gorm.DB
    orderRepo     repositories.OrderRepository
    orderItemRepo repositories.OrderItemRepository
    cartRepo      repositories.CartRepository
    cartItemRepo  repositories.CartItemRepository
    historyRepo   repositories.OrderStatusHistoryRepository
    variantRepo   repositories.ProductVariantRepository  // ADD
}
```

Update constructor to accept `variantRepo`.

### Step 4: Update UpdateStatus with Stock Logic

**File:** `backend/src/internal/services/order_service.go:167-199`

Replace UpdateStatus function:
```go
func (s *orderService) UpdateStatus(ctx context.Context, orderID string, newStatus int8, changedBy string, note string) error {
    return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        txRepo := repositories.NewPostgreSQLStorage(tx)

        order, err := txRepo.FindOrderByID(ctx, orderID)
        if err != nil {
            return fmt.Errorf("failed to find order: %w", err)
        }
        if order == nil {
            return ErrOrderNotFound
        }

        if !models.IsValidTransition(order.Status, newStatus) {
            return ErrInvalidTransition
        }

        // Stock deduction on CONFIRMED
        if newStatus == models.ORDER_STATUS_CONFIRMED && order.Status < models.ORDER_STATUS_CONFIRMED {
            if err := s.handleStockDeduction(ctx, txRepo, orderID); err != nil {
                return err
            }
        }

        // Stock restoration on CANCELLED (if was CONFIRMED or later)
        if newStatus == models.ORDER_STATUS_CANCELLED && order.Status >= models.ORDER_STATUS_CONFIRMED {
            if err := s.handleStockRestoration(ctx, txRepo, orderID); err != nil {
                return err
            }
        }

        history := &models.OrderStatusHistory{
            ID:         uuid.New().String(),
            OrderID:    orderID,
            FromStatus: &order.Status,
            ToStatus:   newStatus,
            Note:       note,
        }
        if changedBy != "" {
            history.ChangedBy = &changedBy
        }
        if err := txRepo.CreateStatusHistory(ctx, history); err != nil {
            return err
        }

        return txRepo.UpdateOrder(ctx, orderID, map[string]interface{}{"status": newStatus})
    })
}

func (s *orderService) handleStockDeduction(ctx context.Context, repo repositories.Storage, orderID string) error {
    items, err := repo.ListOrderItems(ctx, orderID)
    if err != nil {
        return fmt.Errorf("failed to get order items: %w", err)
    }
    for _, item := range items {
        if item.AttrID != nil && *item.AttrID != "" {
            if err := repo.DeductStock(ctx, *item.AttrID, item.Quantity); err != nil {
                return fmt.Errorf("failed to deduct stock for variant %s: %w", *item.AttrID, err)
            }
        }
    }
    return nil
}

func (s *orderService) handleStockRestoration(ctx context.Context, repo repositories.Storage, orderID string) error {
    items, err := repo.ListOrderItems(ctx, orderID)
    if err != nil {
        return fmt.Errorf("failed to get order items: %w", err)
    }
    for _, item := range items {
        if item.AttrID != nil && *item.AttrID != "" {
            if err := repo.RestoreStock(ctx, *item.AttrID, item.Quantity); err != nil {
                return fmt.Errorf("failed to restore stock for variant %s: %w", *item.AttrID, err)
            }
        }
    }
    return nil
}
```

### Step 5: Update DI/Initialize

**File:** `backend/src/internal/initialize/service.go`

Pass `variantRepo` to `NewOrderService()`.

### Step 6: Write Tests

**File:** `backend/src/internal/services/order_service_test.go`

Add tests for:
- TestUpdateStatus_ShippingToCancelled
- TestUpdateStatus_ConfirmedDeductsStock
- TestUpdateStatus_CancelledRestoresStock
- TestUpdateStatus_CancelledBeforeConfirmed_NoStockChange

## Todo List

- [x] Update ValidOrderTransitions (add CANCELLED to SHIPPING)
- [x] Add DeductStock/RestoreStock to variant repo interface
- [x] Implement DeductStock/RestoreStock methods
- [x] Add handleStockDeduction helper
- [x] Add handleStockRestoration helper
- [x] Modify UpdateStatus to call stock helpers
- [x] Write unit tests
- [x] Run `go build` and fix errors
- [x] Run `go test ./...`

## Success Criteria

- SHIPPING orders can be cancelled
- Stock decrements when order is CONFIRMED
- Stock restores when CONFIRMED+ order is CANCELLED
- All tests pass
- No regression in existing functionality

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Race condition | Transaction wraps all stock operations |
| Insufficient stock | WHERE clause checks `stock >= quantity` |
| Negative sold | `GREATEST(sold - ?, 0)` prevents negative |
