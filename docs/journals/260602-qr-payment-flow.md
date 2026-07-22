# QR Bank Transfer Payment Flow

**Date:** 2026-06-02

## Summary

Implemented bank transfer payment flow with QR code display. Orders now start in AWAITING_PAYMENT status, users mark as transferred, admin verifies manually.

## Changes

### Backend
- Added `ORDER_STATUS_AWAITING_PAYMENT (7)` and `ORDER_STATUS_PAYMENT_SUBMITTED (8)`
- `CreateFromCart` sets status 7 instead of PENDING
- `CancelOrder` allows cancellation from status 7
- New endpoint: `PUT /orders/:id/mark-transferred`
- Added i18n keys for new statuses and error messages

### Frontend
- `PaymentQRModal` - shows QR after order placement with copy-to-clipboard
- `PaymentQRSection` - reusable QR display in order detail
- Checkout page integrates modal flow
- User order detail shows QR for status 7, waiting message for status 8
- Admin order detail has "Verify Payment" button for status 8
- Status badge updated with orange (7) and cyan (8) colors

## Flow

```
Checkout → Create Order (status 7) → QR Modal
  ├── "Already Transferred" → status 8 → redirect success
  └── "Close" → redirect success (stays status 7)

Order Detail (status 7) → Show QR + "Mark Transferred" button
Admin (status 8) → "Verify Payment" → status 2 (CONFIRMED)
```

## Testing

- 26/26 unit tests passing
- Service layer coverage: 70-91%
- Code review: 2 i18n fixes applied

## Decisions

- QR image is placeholder for now (fallback UI when image missing)
- Admin panel strings remain Vietnamese (intentional, admin-only)
- Cancel allowed for AWAITING_PAYMENT, blocked after PAYMENT_SUBMITTED
