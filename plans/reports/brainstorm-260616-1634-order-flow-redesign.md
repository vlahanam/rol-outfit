# Brainstorm: Order Flow Redesign

**Date:** 2026-06-16
**Request:** Redesign order purchase flow, confirmation, manual payment - fix admin bugs

## Problem Statement

Current system has manual payment/order confirmation but:
- Admin dashboard has multiple bugs
- Missing stock management automation
- SHIPPING orders can't be cancelled (delivery failures)

## Key Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| PROCESSING status | ❌ Not needed | CONFIRMED → SHIPPING is sufficient |
| SHIPPING → CANCELLED | ✅ Allow | Handle delivery failures, boom orders |
| Stock automation | ✅ Implement | Deduct on CONFIRMED, restore on CANCELLED |

## Current Issues Found

### Backend
1. `ValidOrderTransitions` doesn't allow SHIPPING → CANCELLED
2. No stock deduction/restoration logic

### Frontend Admin (`/admin/orders/[id]/page.tsx`)
1. **Lines 155-164:** Status dropdown shows ALL 8 options - should filter to valid transitions
2. **Lines 89, 103:** Error handling uses `alert()` - should use proper error state
3. **Missing:** No UI for REFUND_REQUESTED (status 7) approve/reject
4. **List page 43-44:** Silent failure on API error

### Frontend User
- Minor: `alert()` on cancel failure

## Proposed Solution

### Phase 1: Backend Order Status & Stock

**1.1 Update ValidOrderTransitions**
```go
ORDER_STATUS_SHIPPING: {ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED},
```

**1.2 Stock deduction in UpdateStatus()**
- On transition to CONFIRMED:
  - Get order items
  - For each item with attr_id: decrement stock, increment sold
  - Wrap in transaction

**1.3 Stock restoration in UpdateStatus()**  
- On transition to CANCELLED from CONFIRMED/SHIPPING/COMPLETED:
  - Restore stock, decrement sold
  - Only if previous status >= CONFIRMED

### Phase 2: Frontend Admin

**2.1 Filter status dropdown**
- Only show statuses allowed by ValidOrderTransitions[currentStatus]

**2.2 Proper error handling**
- Replace alert() with toast or error state display

**2.3 Add REFUND_REQUESTED UI**
- For status 7: Show "Xác nhận hoàn tiền" and "Từ chối" buttons

**2.4 List page error display**
- Show error message on fetch failure
- Add retry button

### Phase 3: Frontend User
- Replace alert() with toast notifications

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stock race condition | Data inconsistency | Transaction + row lock (SELECT FOR UPDATE) |
| Cancel shipped order | Business confusion | Admin must verify before cancel |
| Negative stock | Bad inventory data | Check stock >= quantity before confirm |

## Files to Modify

**Backend:**
- `backend/src/internal/models/order.go` - ValidOrderTransitions
- `backend/src/internal/services/order_service.go` - UpdateStatus() stock logic
- `backend/src/internal/repositories/` - Stock update methods

**Frontend:**
- `frontend/app/admin/(protected)/orders/[id]/page.tsx` - Major fixes
- `frontend/app/admin/(protected)/orders/page.tsx` - Error handling
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx` - Minor alert fix

## Success Criteria

- [ ] SHIPPING orders can be cancelled by admin
- [ ] Stock auto-deducted on CONFIRMED
- [ ] Stock auto-restored on CANCELLED (if was CONFIRMED+)
- [ ] Admin status dropdown only shows valid transitions
- [ ] Admin has approve/reject refund buttons for status 7
- [ ] No more browser alert() - proper error handling
- [ ] Backend tests pass

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Backend | 1.5h |
| Phase 2: Admin Frontend | 1h |
| Phase 3: User Frontend | 15min |
| Testing | 30min |
| **Total** | ~3h |
