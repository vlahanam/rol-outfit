# Phase 3: Service Layer

## Overview
Add transition validation, history recording, and refund request methods.

**Priority:** High | **Status:** pending | **Effort:** 2h

## Files to Modify

- `backend/src/internal/repositories/order_repo.go` (add history methods)
- `backend/src/internal/services/order_service.go` (update existing + add new)

## Implementation

### Repository: Add History Methods

```go
// In OrderRepository interface
CreateStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error
ListStatusHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error)

// Implementation
func (r *postgreSQLStorage) CreateStatusHistory(ctx context.Context, h *models.OrderStatusHistory) error {
    return r.db.WithContext(ctx).Create(h).Error
}

func (r *postgreSQLStorage) ListStatusHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error) {
    var history []*models.OrderStatusHistory
    err := r.db.WithContext(ctx).
        Where("order_id = ?", orderID).
        Order("created_at ASC").
        Find(&history).Error
    return history, err
}
```

### Service: Update Interface

```go
type OrderService interface {
    // Existing
    CreateFromCart(ctx context.Context, userID string, req *requests.CreateOrderRequest) (*models.Order, []*models.OrderItem, error)
    GetOrder(ctx context.Context, userID, orderID string, isAdmin bool) (*models.Order, []*models.OrderItem, error)
    ListUserOrders(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
    ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
    CancelOrder(ctx context.Context, userID, orderID string, isAdmin bool) error
    MarkAsTransferred(ctx context.Context, userID, orderID string) error
    
    // Updated
    UpdateStatus(ctx context.Context, orderID string, newStatus int8, changedBy string, note string) error
    UpdateShippingInfo(ctx context.Context, userID, orderID string, req *requests.UpdateOrderShippingRequest) error
    
    // New
    RequestRefund(ctx context.Context, userID, orderID string, reason string) error
    ApproveRefund(ctx context.Context, orderID string, adminID string) error
    RejectRefund(ctx context.Context, orderID string, adminID string, reason string) error
    GetOrderHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error)
}
```

### Service: Key Method Implementations

#### UpdateStatus (with validation + history)

```go
var ErrInvalidTransition = errors.New("invalid status transition")

func (s *orderService) UpdateStatus(ctx context.Context, orderID string, newStatus int8, changedBy string, note string) error {
    return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        txRepo := repositories.NewPostgreSQLStorage(tx)
        
        order, err := txRepo.FindOrderByID(ctx, orderID)
        if err != nil {
            return err
        }
        if order == nil {
            return ErrOrderNotFound
        }
        
        // Validate transition
        if !models.IsValidTransition(order.Status, newStatus) {
            return ErrInvalidTransition
        }
        
        // Record history
        history := &models.OrderStatusHistory{
            ID:        uuid.New().String(),
            OrderID:   orderID,
            FromStatus: &order.Status,
            ToStatus:  newStatus,
            ChangedBy: &changedBy,
            Note:      note,
        }
        if err := txRepo.CreateStatusHistory(ctx, history); err != nil {
            return err
        }
        
        return txRepo.UpdateOrder(ctx, orderID, map[string]interface{}{"status": newStatus})
    })
}
```

#### RequestRefund

```go
var ErrCannotRequestRefund = errors.New("can only request refund for completed orders")

func (s *orderService) RequestRefund(ctx context.Context, userID, orderID string, reason string) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    if err != nil {
        return err
    }
    if order == nil {
        return ErrOrderNotFound
    }
    if order.UserID != userID {
        return ErrOrderNotOwned
    }
    if order.Status != models.ORDER_STATUS_COMPLETED {
        return ErrCannotRequestRefund
    }
    
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUND_REQUESTED, userID, reason)
}
```

#### ApproveRefund / RejectRefund

```go
var ErrNotRefundRequest = errors.New("order is not pending refund approval")

func (s *orderService) ApproveRefund(ctx context.Context, orderID string, adminID string) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    if err != nil {
        return err
    }
    if order == nil {
        return ErrOrderNotFound
    }
    if order.Status != models.ORDER_STATUS_REFUND_REQUESTED {
        return ErrNotRefundRequest
    }
    
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUNDED, adminID, "Refund approved")
}

func (s *orderService) RejectRefund(ctx context.Context, orderID string, adminID string, reason string) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    if err != nil {
        return err
    }
    if order == nil {
        return ErrOrderNotFound
    }
    if order.Status != models.ORDER_STATUS_REFUND_REQUESTED {
        return ErrNotRefundRequest
    }
    
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_COMPLETED, adminID, "Refund rejected: "+reason)
}
```

### Update CancelOrder

Allow cancel up to CONFIRMED status (not just AWAITING_PAYMENT):

```go
func (s *orderService) CancelOrder(ctx context.Context, userID, orderID string, isAdmin bool) error {
    order, err := s.orderRepo.FindOrderByID(ctx, orderID)
    if err != nil {
        return err
    }
    if order == nil {
        return ErrOrderNotFound
    }
    if !isAdmin && order.UserID != userID {
        return ErrOrderNotOwned
    }
    
    // Can cancel: AWAITING_PAYMENT, PAYMENT_SUBMITTED, CONFIRMED
    if order.Status > models.ORDER_STATUS_CONFIRMED {
        return ErrCannotCancel
    }
    
    changedBy := userID
    if isAdmin {
        changedBy = "admin" // or pass actual admin ID
    }
    return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, changedBy, "Order cancelled")
}
```

## Todo

- [ ] Add repository methods for history
- [ ] Update service interface
- [ ] Implement UpdateStatus with validation + history
- [ ] Implement RequestRefund
- [ ] Implement ApproveRefund / RejectRefund
- [ ] Implement GetOrderHistory
- [ ] Update CancelOrder logic
- [ ] Update MarkAsTransferred to record history
- [ ] Run tests

## Success Criteria

- Invalid transitions rejected with proper error
- Every status change creates history record
- Refund flow works end-to-end
- All existing functionality preserved
