# Phase 2: Backend Service Changes

**Status:** pending | **Effort:** 30m | **Priority:** high

## Overview

Modify order service to use new payment statuses.

## Files to Modify

- `backend/src/internal/services/order_service.go`

## Implementation Steps

### 1. Modify CreateFromCart

Change initial status from PENDING to AWAITING_PAYMENT:

```go
// In CreateFromCart function
order := &models.Order{
    // ...existing fields
    Status: models.ORDER_STATUS_AWAITING_PAYMENT,  // Changed from ORDER_STATUS_PENDING
}
```

### 2. Modify CancelOrder

Allow cancellation for AWAITING_PAYMENT status:

```go
// In CancelOrder function
// Change validation from:
if order.Status != models.ORDER_STATUS_PENDING {
    return errors.New("only pending orders can be cancelled")
}

// To:
if order.Status != models.ORDER_STATUS_PENDING && 
   order.Status != models.ORDER_STATUS_AWAITING_PAYMENT {
    return errors.New("only pending or awaiting payment orders can be cancelled")
}
```

## Todo

- [ ] Update CreateFromCart to set AWAITING_PAYMENT
- [ ] Update CancelOrder to allow AWAITING_PAYMENT
- [ ] Run tests: `go test ./src/internal/services/...`

## Success Criteria

- New orders created with status 7 (AWAITING_PAYMENT)
- Orders with status 7 can be cancelled
- Existing cancel logic for PENDING still works
