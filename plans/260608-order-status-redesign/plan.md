---
status: completed
priority: high
estimated_effort: 1-2 days
blockedBy: []
blocks: []
---

# Order Status Flow Redesign

## Overview

Redesign order status system from confused 8-status layout to clean, linear flow with proper refund handling and audit trail.

**Brainstorm Report:** [brainstorm-260607-2332-order-status-redesign.md](../reports/brainstorm-260607-2332-order-status-redesign.md)

## Problem

Current statuses have unclear distinctions (PENDING vs AWAITING_PAYMENT, PAID vs CONFIRMED). Values misaligned between backend constants and frontend mapping. No status transition validation. No audit history.

## Solution

- Reorganize 8 statuses with clean values (1-8)
- Add `order_status_history` table for audit
- Implement state machine validation in service layer
- Add refund request/approval workflow
- Update frontend to match new flow

## Phases

| Phase | Title | Status | Effort |
|-------|-------|--------|--------|
| 1 | [Database Migration](./phase-01-database-migration.md) | completed | 0.5h |
| 2 | [Backend Models](./phase-02-backend-models.md) | completed | 0.5h |
| 3 | [Service Layer](./phase-03-service-layer.md) | completed | 2h |
| 4 | [Controller Layer](./phase-04-controller-layer.md) | completed | 1h |
| 5 | [Frontend Updates](./phase-05-frontend-updates.md) | completed | 2h |

## Status Values (Final)

| Status | Value | Vietnamese |
|--------|-------|------------|
| AWAITING_PAYMENT | 1 | Chờ chuyển khoản |
| PAYMENT_SUBMITTED | 2 | Đã báo CK |
| CONFIRMED | 3 | Xác nhận thành công |
| SHIPPING | 4 | Đang giao |
| COMPLETED | 5 | Hoàn thành |
| CANCELLED | 6 | Đã hủy |
| REFUND_REQUESTED | 7 | Yêu cầu hoàn tiền |
| REFUNDED | 8 | Đã hoàn tiền |

## Key Files

**Backend:**
- `backend/src/internal/models/order.go`
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/controllers/order_controller.go`
- `backend/database/migrations/`

**Frontend:**
- `frontend/components/orders/order-status-badge.tsx`
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx`

## Risk

- Database reset required (user confirmed acceptable)
- Frontend status constants must match backend exactly

## Success Criteria

- [x] All status transitions validated
- [x] History recorded for every status change
- [x] Refund request/approval flow working
- [x] Frontend displays correct status labels
- [x] Cancel button appears only when allowed
