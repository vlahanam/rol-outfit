---
title: "Phase 3: Checkout & Order Management"
description: "Complete checkout flow, user order pages, admin order detail with real API"
status: completed
priority: P1
effort: 8h
branch: develop
tags: [frontend, e-commerce, orders, checkout]
created: 2026-05-14
completed: 2026-05-14
blockedBy: []
blocks: []
---

# Phase 3: Checkout & Order Management

## Overview

Complete the remaining Phase 3 features for the e-commerce flow. Auth UI, Cart page, and Add-to-cart are already complete.

**Priority:** P1 - Critical for MVP
**Effort:** ~8 hours
**Dependencies:** None (all backend APIs exist)

## Current State Analysis

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Checkout | `POST /orders` | ✅ | Complete |
| User orders list | `GET /orders` | ✅ | Complete |
| User order detail | `GET /orders/:id` | ✅ | Complete |
| Order cancel | `DELETE /orders/:id` | ✅ | Complete |
| Admin order detail | `GET /admin/orders/:id` | ✅ | Complete |
| Admin status update | `PUT /admin/orders/:id/status` | ✅ | Complete |
| Header auth state | — | ✅ | Complete |

## Scope

### In Scope
1. **Checkout Flow** - Shipping form → Order creation → Success page
2. **User Order Pages** - History list, Detail view, Cancel action
3. **Admin Order Detail** - Replace mock with real API + status update
4. **Header Auth State** - Show user info when logged in

### Out of Scope
- Payment gateway (Phase 4)
- Email notifications (Phase 4)
- Order tracking with timeline

## Architecture

### File Structure
```
frontend/app/[locale]/(main)/
├── checkout/
│   ├── page.tsx          # Shipping form
│   └── success/page.tsx  # Order confirmation
├── orders/
│   ├── page.tsx          # Order history list
│   └── [id]/page.tsx     # Order detail

frontend/app/admin/(protected)/orders/
└── [id]/page.tsx         # Update to use real API

frontend/components/
├── checkout/
│   └── shipping-form.tsx # Reusable shipping form
└── orders/
    ├── order-card.tsx    # Order card for list
    └── order-status-badge.tsx
```

### API Contracts (Existing)

**Create Order:**
```
POST /api/v1/orders
Body: { shipping_address: string, phone: string, note?: string }
Response: { data: Order }
```

**List User Orders:**
```
GET /api/v1/orders?page=1&limit=10
Response: { data: Order[], meta: Pagination }
```

**Get Order Detail:**
```
GET /api/v1/orders/:id
Response: { data: Order }
```

**Cancel Order:**
```
DELETE /api/v1/orders/:id
Response: 204 No Content
```

**Admin Update Status:**
```
PUT /api/v1/admin/orders/:id/status
Body: { status: number }
Response: { data: Order }
```

### Order Status Codes
| Code | Label | Can Cancel |
|------|-------|------------|
| 1 | pending | ✅ Yes |
| 2 | confirmed | ❌ No |
| 3 | shipped | ❌ No |
| 4 | delivered | ❌ No |
| 5 | paid | ❌ No |
| 6 | cancelled | ❌ No |

## Implementation Phases

### Phase 1: Checkout Flow (3h)
- [ ] Create `/checkout/page.tsx` with shipping form
- [ ] Validate form with Zod (address, phone required)
- [ ] Call `POST /orders` API
- [ ] Create `/checkout/success/page.tsx` with order summary
- [ ] Update Cart page checkout button to navigate

### Phase 2: User Order Pages (2.5h)
- [ ] Create `/orders/page.tsx` with order list
- [ ] Create `/orders/[id]/page.tsx` with detail view
- [ ] Implement cancel order (only for pending status)
- [ ] Add "My Orders" link to Header when logged in

### Phase 3: Admin Order Detail (1.5h)
- [ ] Replace mock data with `GET /admin/orders/:id`
- [ ] Implement status update with `PUT /admin/orders/:id/status`
- [ ] Add loading/error states

### Phase 4: Header Auth State (1h)
- [ ] Check login status on mount
- [ ] Show user icon → dropdown (Profile, Orders, Logout) when logged in
- [ ] Show login link when not logged in
- [ ] Implement logout functionality

## Success Criteria (All Met)

1. ✅ User can checkout from cart with shipping info
2. ✅ User sees order confirmation after checkout
3. ✅ User can view order history
4. ✅ User can view order detail
5. ✅ User can cancel pending orders
6. ✅ Admin can view real order data
7. ✅ Admin can update order status
8. ✅ Header shows auth state correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cart empty after checkout | Low | Clear cart context after success |
| Order API validation errors | Medium | Match backend validation in frontend |
| Token expiry during checkout | Low | Auto-refresh already implemented |

## i18n Keys Required

Add to `messages/vn.json` and `messages/jp.json`:
- CheckoutPage: title, shippingAddress, phone, note, placeOrder, submitting
- OrderSuccessPage: title, orderPlaced, orderNumber, continueShopping, viewOrders
- OrdersPage: title, empty, orderNumber, status, total, viewDetail, cancel
- OrderDetailPage: title, items, shipping, payment, cancelOrder

## Related Files (Read Before Implementation)

- `frontend/app/[locale]/(main)/cart/page.tsx` - Cart structure, API patterns
- `frontend/lib/api.ts` - API client usage
- `frontend/lib/validations.ts` - Zod schema patterns
- `frontend/context/cart-context.tsx` - Cart state management
- `frontend/types/api.ts` - Type definitions
- `backend/src/internal/requests/order_request.go` - Backend validation rules
