# Phase 6: Frontend Status Badge & i18n

**Status:** pending | **Effort:** 30m | **Priority:** medium

## Overview

Update order status badge component and i18n files for new statuses.

## Files to Modify

- `frontend/components/orders/order-status-badge.tsx`
- `frontend/messages/en.json`
- `frontend/messages/vi.json`
- `frontend/messages/ja.json` (if exists)

## Implementation Steps

### 1. Update OrderStatusBadge

Add styles and keys for new statuses:

```typescript
const STATUS_STYLES: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700",      // pending
  2: "bg-purple-100 text-purple-700",      // confirmed
  3: "bg-blue-100 text-blue-700",          // shipping
  4: "bg-green-100 text-green-700",        // delivered
  5: "bg-green-100 text-green-700",        // paid
  6: "bg-red-100 text-red-700",            // cancelled
  7: "bg-orange-100 text-orange-700",      // awaiting_payment (NEW)
  8: "bg-cyan-100 text-cyan-700",          // payment_submitted (NEW)
};

const STATUS_KEYS: Record<number, string> = {
  1: "pending",
  2: "confirmed",
  3: "shipped",
  4: "delivered",
  5: "paid",
  6: "cancelled",
  7: "awaitingPayment",    // NEW
  8: "paymentSubmitted",   // NEW
};
```

### 2. Add i18n Keys

**English (en.json):**
```json
{
  "OrderStatus": {
    "awaitingPayment": "Awaiting Payment",
    "paymentSubmitted": "Payment Submitted"
  },
  "Checkout": {
    "paymentTitle": "Order Payment",
    "transferContent": "Transfer content",
    "alreadyTransferred": "Already Transferred",
    "close": "Close"
  },
  "Order": {
    "paymentInfo": "Payment Information",
    "transferContent": "Transfer content",
    "markAsTransferred": "Mark as Transferred",
    "waitingForVerification": "Waiting for payment verification",
    "verifyPayment": "Verify Payment"
  }
}
```

**Vietnamese (vi.json):**
```json
{
  "OrderStatus": {
    "awaitingPayment": "Chờ chuyển khoản",
    "paymentSubmitted": "Đã báo chuyển khoản"
  },
  "Checkout": {
    "paymentTitle": "Thanh toán đơn hàng",
    "transferContent": "Nội dung chuyển khoản",
    "alreadyTransferred": "Đã chuyển khoản",
    "close": "Đóng"
  },
  "Order": {
    "paymentInfo": "Thông tin thanh toán",
    "transferContent": "Nội dung chuyển khoản",
    "markAsTransferred": "Đã chuyển khoản",
    "waitingForVerification": "Đang chờ xác nhận thanh toán",
    "verifyPayment": "Xác nhận thanh toán"
  }
}
```

**Japanese (ja.json):** (if exists)
```json
{
  "OrderStatus": {
    "awaitingPayment": "支払い待ち",
    "paymentSubmitted": "支払い報告済み"
  }
}
```

## Todo

- [ ] Add status 7, 8 to STATUS_STYLES
- [ ] Add status 7, 8 to STATUS_KEYS
- [ ] Add OrderStatus i18n keys (en, vi, ja)
- [ ] Add Checkout modal i18n keys
- [ ] Add Order detail i18n keys
- [ ] Verify all locales render correctly

## Success Criteria

- Status 7 shows orange badge "Chờ chuyển khoản"
- Status 8 shows cyan badge "Đã báo chuyển khoản"
- All modal/section text translated
