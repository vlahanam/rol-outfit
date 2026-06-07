# Brainstorm: Order Status Flow Redesign

**Date:** 2026-06-07  
**Status:** Approved  

## Problem Statement

Current order system has 8 statuses with unclear distinctions (PENDING vs AWAITING_PAYMENT, PAID vs CONFIRMED). Need simplified, linear flow with refund handling.

## Requirements

- 5 main statuses for happy path (user requested)
- Cancel order functionality
- Refund request/approval workflow
- Status history tracking (audit trail)

## Approved Design

### 8 Statuses (Final)

| Status | Value | Vietnamese | Description |
|--------|-------|------------|-------------|
| AWAITING_PAYMENT | 1 | Chờ chuyển khoản | Order created, waiting user transfer |
| PAYMENT_SUBMITTED | 2 | Đã báo CK | User clicked "Đã chuyển khoản" |
| CONFIRMED | 3 | Xác nhận thành công | Admin verified payment |
| SHIPPING | 4 | Đang giao | Order in delivery |
| COMPLETED | 5 | Hoàn thành | Delivered successfully |
| CANCELLED | 6 | Đã hủy | Cancelled (terminal) |
| REFUND_REQUESTED | 7 | Yêu cầu hoàn tiền | User requested refund |
| REFUNDED | 8 | Đã hoàn tiền | Refund processed (terminal) |

### State Transitions

```
AWAITING_PAYMENT → PAYMENT_SUBMITTED, CANCELLED
PAYMENT_SUBMITTED → CONFIRMED, AWAITING_PAYMENT, CANCELLED
CONFIRMED → SHIPPING, CANCELLED
SHIPPING → COMPLETED
COMPLETED → REFUND_REQUESTED
REFUND_REQUESTED → REFUNDED, COMPLETED
```

### New Table: order_status_history

- Track all status changes with timestamps
- Record who changed (user/admin)
- Optional note field

### Permission Matrix

| Action | User | Admin |
|--------|------|-------|
| Mark transferred | ✅ | ✅ |
| Confirm payment | ❌ | ✅ |
| Cancel (before SHIPPING) | ✅ | ✅ |
| Request refund (COMPLETED) | ✅ | ✅ |
| Approve/Reject refund | ❌ | ✅ |

## Implementation Scope

**Backend:**
- models/order.go: Update constants, add history model
- repositories/order_repo.go: History recording
- services/order_service.go: Transition validation
- controllers/order_controller.go: Refund endpoints
- New migration: history table

**Frontend:**
- order-status-badge.tsx: Update labels/colors
- orders/[id]/page.tsx: Refund button, history timeline
- Admin order management UI updates

## Trade-offs

- 8 statuses vs 5: More complete but slightly complex
- History table: Extra writes but full audit trail
- Refund request flow: User involvement vs simpler admin-only

## Risks

- DB reset needed (acceptable per user)
- Concurrent update handling via transactions

## Next Steps

Create detailed implementation plan with phases.
