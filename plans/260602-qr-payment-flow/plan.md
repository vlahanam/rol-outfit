---
status: completed
priority: high
created: 2026-06-02
completed: 2026-06-02
estimatedEffort: 4h
actualEffort: ~2h
blockedBy: []
blocks: []
---

# QR Bank Transfer Payment Flow

## Overview

Implement bank transfer payment flow with QR code display after order placement. User marks payment as transferred, admin verifies manually.

## Context

- Brainstorm: `plans/reports/brainstorm-260602-qr-payment-flow.md`
- Current order flow: Checkout → PENDING → Admin confirms
- New flow: Checkout → AWAITING_PAYMENT → User marks transferred → PAYMENT_SUBMITTED → Admin verifies → CONFIRMED

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | [Backend Status Constants](phase-01-backend-status-constants.md) | ✓ done | 15m | order.go |
| 2 | [Backend Service Changes](phase-02-backend-service-changes.md) | ✓ done | 30m | order_service.go |
| 3 | [Backend New Endpoint](phase-03-backend-new-endpoint.md) | ✓ done | 45m | controller, route |
| 4 | [Frontend QR Modal](phase-04-frontend-qr-modal.md) | ✓ done | 1h | checkout, modal |
| 5 | [Frontend Order Detail](phase-05-frontend-order-detail.md) | ✓ done | 1h | order detail pages |
| 6 | [Frontend Status Badge](phase-06-frontend-status-badge.md) | ✓ done | 30m | badge, i18n |

## Key Dependencies

- Backend phases (1-3) can run in parallel
- Frontend phases (4-6) depend on backend completion
- Phase 4 and 5 share QR component → extract shared component

## Success Criteria

- [x] Order created with AWAITING_PAYMENT status
- [x] QR modal shows after checkout with correct transfer content
- [x] User can mark as transferred → PAYMENT_SUBMITTED
- [x] User can close modal → stays AWAITING_PAYMENT
- [x] Order detail shows QR for AWAITING_PAYMENT orders
- [x] Admin can verify payment → CONFIRMED
- [x] Cancel allowed for AWAITING_PAYMENT orders
- [x] Status badges display correctly for new statuses
