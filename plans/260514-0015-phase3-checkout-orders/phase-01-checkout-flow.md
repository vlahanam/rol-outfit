# Phase 1: Checkout Flow

**Priority:** P1
**Effort:** 3h
**Status:** completed

## Overview

Create checkout page with shipping form, order creation, and success confirmation.

## Context Links
- Cart page: `frontend/app/[locale]/(main)/cart/page.tsx`
- API client: `frontend/lib/api.ts`
- Validations: `frontend/lib/validations.ts`
- Cart context: `frontend/context/cart-context.tsx`

## Requirements

### Functional
- Shipping address form (address, phone, note)
- Form validation with Zod
- Create order via `POST /orders`
- Success page with order summary
- Clear cart after successful order

### Non-functional
- i18n support (vn, jp)
- Mobile responsive
- Loading states during API calls

## Implementation Steps

### 1. Create Checkout Page

**File:** `frontend/app/[locale]/(main)/checkout/page.tsx`

```tsx
// Key structure:
// - Redirect to /login if not logged in
// - Redirect to /cart if cart is empty
// - Shipping form with validation
// - Order summary sidebar
// - Place order button
```

**Form Fields:**
- `shipping_address` (textarea, required, min 10 chars)
- `phone` (input, required, Vietnamese phone regex)
- `note` (textarea, optional)

**API Call:**
```ts
await api.post('/orders', {
  shipping_address: address,
  phone: phone,
  note: note || undefined
});
```

### 2. Add Zod Schema

**File:** `frontend/lib/validations.ts`

```ts
export function createCheckoutSchema(t: (key: string) => string) {
  return z.object({
    shipping_address: z.string()
      .min(10, t('addressTooShort'))
      .max(500, t('addressTooLong')),
    phone: z.string()
      .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, t('invalidPhone')),
    note: z.string().max(500).optional(),
  });
}
```

### 3. Create Success Page

**File:** `frontend/app/[locale]/(main)/checkout/success/page.tsx`

```tsx
// Show:
// - Success icon/animation
// - Order ID
// - Order summary (items, total)
// - "View Orders" button → /orders
// - "Continue Shopping" button → /shop
```

**Note:** Pass order data via URL search params or fetch from API.

### 4. Update Cart Page

**File:** `frontend/app/[locale]/(main)/cart/page.tsx`

Change checkout button from:
```tsx
<button className="...">
  {t('checkout')}
</button>
```

To:
```tsx
<Link href="/checkout" className="...">
  {t('checkout')}
</Link>
```

### 5. Update Cart Context

**File:** `frontend/context/cart-context.tsx`

Add `clearCart` function:
```ts
const clearCart = () => {
  setCartCount(0);
};
```

Call after successful order in checkout page.

### 6. Add i18n Keys

**File:** `frontend/messages/vn.json`
```json
{
  "CheckoutPage": {
    "title": "Thanh toán",
    "shippingAddress": "Địa chỉ giao hàng",
    "addressPlaceholder": "Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố",
    "phone": "Số điện thoại",
    "phonePlaceholder": "0912345678",
    "note": "Ghi chú",
    "notePlaceholder": "Ghi chú cho đơn hàng (tùy chọn)",
    "orderSummary": "Tóm tắt đơn hàng",
    "placeOrder": "Đặt hàng",
    "submitting": "Đang xử lý...",
    "emptyCart": "Giỏ hàng trống"
  },
  "CheckoutSuccessPage": {
    "title": "Đặt hàng thành công!",
    "thankYou": "Cảm ơn bạn đã đặt hàng",
    "orderNumber": "Mã đơn hàng",
    "viewOrders": "Xem đơn hàng",
    "continueShopping": "Tiếp tục mua sắm"
  },
  "Validation": {
    "addressTooShort": "Địa chỉ phải có ít nhất 10 ký tự",
    "addressTooLong": "Địa chỉ không được quá 500 ký tự",
    "invalidPhone": "Số điện thoại không hợp lệ"
  }
}
```

## Todo List

- [x] Create `frontend/app/[locale]/(main)/checkout/page.tsx`
- [x] Add `createCheckoutSchema` to `frontend/lib/validations.ts`
- [x] Create `frontend/app/[locale]/(main)/checkout/success/page.tsx`
- [x] Update Cart page checkout button to Link
- [x] Add `clearCart` to cart-context
- [x] Add i18n keys to `vn.json` and `jp.json`
- [x] Test full flow: cart → checkout → success

## Success Criteria

- [x] User can fill shipping form with validation
- [x] User sees error messages for invalid input
- [x] Order is created via API
- [x] Cart is cleared after successful order
- [x] User sees success page with order ID
- [x] User can navigate to orders or continue shopping
