---
name: order-cancel-refund-flow
status: complete
priority: high
created: 2026-06-16
estimatedEffort: 2-3h
blockedBy: []
blocks: []
---

# Order Cancel & Refund Flow Enhancement

## Overview

Enhance order cancellation to require reason for paid orders, and allow admin to refund cancelled orders directly.

## Context

- **Brainstorm:** `plans/reports/brainstorm-260616-1550-order-cancel-refund-flow.md`
- **Related completed plans:** `260608-order-status-redesign`, `260602-qr-payment-flow`

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend: Cancel with Reason](phase-01-backend-cancel-reason.md) | ✅ done | 30min |
| 2 | [Backend: Admin Refund Cancelled](phase-02-backend-admin-refund.md) | ✅ done | 20min |
| 3 | [Frontend: Cancel Modal](phase-03-frontend-cancel-modal.md) | ✅ done | 45min |
| 4 | [Frontend: Admin Refund Button](phase-04-frontend-admin-refund.md) | ✅ done | 30min |

## Key Files

**Backend:**
- `backend/src/internal/models/order.go` - Add transition 6→8
- `backend/src/internal/controllers/order_controller.go` - Accept reason param
- `backend/src/internal/services/order_service.go` - Validate reason
- `backend/src/internal/controllers/admin_order_controller.go` - Refund endpoint

**Frontend:**
- `frontend/components/orders/cancel-order-modal.tsx` - New component
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx` - Use cancel modal
- `frontend/app/admin/(protected)/orders/[id]/page.tsx` - Refund button

## Success Criteria

- [ ] Status 1: Cancel không cần lý do
- [ ] Status 2,3: Cancel bắt buộc lý do
- [ ] Admin có thể hoàn tiền đơn đã hủy (6→8)
- [ ] Order history ghi nhận lý do
- [ ] Translations VI/EN

## Cook Command

```bash
/cook plans/260616-1550-order-cancel-refund-flow/plan.md
```
