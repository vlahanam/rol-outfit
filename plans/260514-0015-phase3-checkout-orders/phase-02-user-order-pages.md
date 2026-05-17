# Phase 2: User Order Pages

**Priority:** P1
**Effort:** 2.5h
**Status:** completed
**Blocked By:** None

## Overview

Create user-facing order history and detail pages with cancel functionality.

## Context Links
- Admin orders list: `frontend/app/admin/(protected)/orders/page.tsx` (reference for patterns)
- Cart page: `frontend/app/[locale]/(main)/cart/page.tsx` (styling reference)
- API types: `frontend/types/api.ts`

## Requirements

### Functional
- List user's orders with pagination
- View order detail with items
- Cancel pending orders
- Empty state for no orders

### Non-functional
- Protected route (redirect to /login if not logged in)
- i18n support
- Mobile responsive

## API Endpoints

```ts
// List orders
GET /api/v1/orders?page=1&limit=10
Response: { data: Order[], meta: { page, limit, total } }

// Get order detail
GET /api/v1/orders/:id
Response: { data: Order }

// Cancel order
DELETE /api/v1/orders/:id
Response: 204 No Content
```

## Implementation Steps

### 1. Create Order List Page

**File:** `frontend/app/[locale]/(main)/orders/page.tsx`

```tsx
// Structure:
// - Check auth, redirect to /login if not logged in
// - Fetch orders from GET /orders
// - Display as cards/list
// - Pagination controls
// - Empty state with "Start Shopping" CTA
```

**Order Card Display:**
- Order ID (first 8 chars uppercase)
- Date
- Status badge (color-coded)
- Total price
- "View" button → /orders/[id]

### 2. Create Order Detail Page

**File:** `frontend/app/[locale]/(main)/orders/[id]/page.tsx`

```tsx
// Structure:
// - Fetch order from GET /orders/:id
// - Order info header (ID, date, status)
// - Items table (product name, variant, qty, price)
// - Shipping info
// - Order summary (subtotal, shipping, total)
// - Cancel button (only if status === 1 pending)
```

### 3. Create Shared Components

**File:** `frontend/components/orders/order-status-badge.tsx`
```tsx
interface Props {
  status: number;
}

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'Đã xác nhận', className: 'bg-purple-100 text-purple-700' },
  3: { label: 'Đang giao', className: 'bg-blue-100 text-blue-700' },
  4: { label: 'Đã giao', className: 'bg-green-100 text-green-700' },
  5: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  6: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
};

export function OrderStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: 'Không rõ', className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
```

### 4. Implement Cancel Order

In order detail page:
```tsx
const handleCancel = async () => {
  if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
  try {
    await api.delete(`/orders/${id}`);
    toast.success('Đã hủy đơn hàng');
    router.push('/orders');
  } catch (err) {
    toast.error('Không thể hủy đơn hàng');
  }
};
```

Show cancel button only when `order.status === 1`.

### 5. Add i18n Keys

**File:** `frontend/messages/vn.json`
```json
{
  "OrdersPage": {
    "title": "Đơn hàng của tôi",
    "empty": "Bạn chưa có đơn hàng nào",
    "emptyDesc": "Hãy khám phá các sản phẩm của chúng tôi",
    "startShopping": "Bắt đầu mua sắm",
    "orderNumber": "Mã đơn",
    "viewDetail": "Xem chi tiết"
  },
  "OrderDetailPage": {
    "title": "Chi tiết đơn hàng",
    "orderInfo": "Thông tin đơn hàng",
    "items": "Sản phẩm",
    "shippingInfo": "Thông tin giao hàng",
    "address": "Địa chỉ",
    "phone": "Số điện thoại",
    "note": "Ghi chú",
    "orderSummary": "Tóm tắt",
    "subtotal": "Tạm tính",
    "shipping": "Phí vận chuyển",
    "total": "Tổng cộng",
    "cancelOrder": "Hủy đơn hàng",
    "cancelConfirm": "Bạn có chắc muốn hủy đơn hàng này?",
    "cancelled": "Đã hủy đơn hàng",
    "cancelFailed": "Không thể hủy đơn hàng"
  }
}
```

## Todo List

- [x] Create `frontend/app/[locale]/(main)/orders/page.tsx`
- [x] Create `frontend/app/[locale]/(main)/orders/[id]/page.tsx`
- [x] Create `frontend/components/orders/order-status-badge.tsx`
- [x] Implement cancel order functionality
- [x] Add i18n keys to `vn.json` and `jp.json`
- [x] Test order list with pagination
- [x] Test order detail view
- [x] Test cancel order (only pending)

## Success Criteria

- [x] User can view list of their orders
- [x] User can view order detail with items
- [x] User can cancel pending orders
- [x] User cannot cancel non-pending orders
- [x] Empty state shows when no orders
- [x] Pagination works correctly
