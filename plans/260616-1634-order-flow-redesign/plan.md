---
name: order-flow-redesign
status: complete
priority: high
created: 2026-06-16
estimatedEffort: 3h
blockedBy: []
blocks: []
---

# Order Flow Redesign

## Overview

Enhance order management with stock automation and fix admin dashboard bugs.

## Context

- **Brainstorm:** `plans/reports/brainstorm-260616-1634-order-flow-redesign.md`
- **Builds on:** `260616-1550-order-cancel-refund-flow` (completed)

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend: Status & Stock](phase-01-backend-status-stock.md) | complete | 1.5h |
| 2 | [Admin Frontend Fixes](phase-02-admin-frontend-fixes.md) | complete | 1h |
| 3 | [User Frontend Fixes](phase-03-user-frontend-fixes.md) | complete | 15min |

## Key Changes

**Backend:**
- SHIPPING → CANCELLED transition (delivery failures)
- Stock deduction on CONFIRMED
- Stock restoration on CANCELLED (if was CONFIRMED+)

**Frontend Admin:**
- Status dropdown filter to valid transitions
- Replace alert() with error states
- Add refund approve/reject UI for status 7
- List page error handling

**Frontend User:**
- Replace alert() with toast

## Key Files

**Backend:**
- `backend/src/internal/models/order.go`
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/repositories/product_variant_repo.go`

**Frontend:**
- `frontend/app/admin/(protected)/orders/[id]/page.tsx`
- `frontend/app/admin/(protected)/orders/page.tsx`
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx`

## Success Criteria

- [x] SHIPPING can transition to CANCELLED
- [x] Stock decrements on CONFIRMED
- [x] Stock restores on CANCELLED (from CONFIRMED+)
- [x] Admin status dropdown shows only valid options
- [x] Admin can approve/reject refund requests
- [x] Proper error handling (no browser alerts)
- [x] All tests pass

## Cook Command

```bash
/cook /home/longan/projects/rol-outfit/plans/260616-1634-order-flow-redesign/plan.md
```
