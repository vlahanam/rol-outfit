# Phase 3: Backend Service Integration + Backfill

## Overview
- **Priority:** High
- **Status:** complete
- **Effort:** 30m

## Files to Modify
- `backend/src/internal/services/order_service.go` - Generate code on create
- `backend/src/internal/initialize/wire.go` or DI setup - Inject new repo

## Implementation

### 1. Update Order Service

**File:** `backend/src/internal/services/order_service.go`

Add to orderService struct:
```go
orderCodeRepo repositories.OrderCodeRepository
```

Update constructor to accept orderCodeRepo.

Modify CreateFromCart:
```go
// Inside transaction, before creating order:
orderCode, err := s.orderCodeRepo.GenerateOrderCode(ctx, tx)
if err != nil {
    return fmt.Errorf("failed to generate order code: %w", err)
}

order = &models.Order{
    ID:              uuid.New().String(),
    OrderCode:       &orderCode,  // Add this line
    UserID:          userID,
    // ... rest unchanged
}
```

### 2. Update DI/Wire Setup

Ensure OrderCodeRepository is created and injected into OrderService.

Check `backend/src/internal/initialize/` for wire setup pattern.

### 3. Backfill Script (One-time)

Create temporary script or add to seeder for backfilling existing orders:

```go
// Pseudocode for backfill
orders := GetAllOrdersWithoutCode(orderByCreatedAt ASC)
for _, order := range orders {
    // Group by date, generate sequential codes
    dateKey := order.CreatedAt.Format("060102")
    seq := GetOrCreateSequence(dateKey)
    code := fmt.Sprintf("ROL-%s-%03d", dateKey, seq)
    UpdateOrderCode(order.ID, code)
}
```

## Todo
- [ ] Add orderCodeRepo to orderService struct
- [ ] Update orderService constructor
- [ ] Modify CreateFromCart to generate order_code
- [ ] Update DI setup to inject repository
- [ ] Create/run backfill for existing orders
- [ ] Test order creation generates correct code

## Notes
- GenerateOrderCode must run inside same transaction as order creation
- Backfill should process orders in created_at order to maintain chronological codes
- After backfill, verify all orders have unique codes
