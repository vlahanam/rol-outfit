# Phase 4: Frontend Display Updates

## Overview
- **Priority:** High
- **Status:** complete
- **Effort:** 30m

## Files to Modify
- `frontend/types/api.ts` - Add order_code to Order interface
- `frontend/app/[locale]/(main)/orders/page.tsx` - Display order_code
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx` - Display order_code in header
- `frontend/app/admin/(protected)/orders/page.tsx` - Display order_code column
- `frontend/app/admin/(protected)/orders/[id]/page.tsx` - Display order_code

## Implementation

### 1. Update Order Type
**File:** `frontend/types/api.ts`

Add to Order interface (line ~129):
```typescript
export interface Order {
  id: string;
  order_code: string;  // Add this line
  user_id: string;
  // ... rest unchanged
}
```

### 2. Customer Orders List
**File:** `frontend/app/[locale]/(main)/orders/page.tsx`

Line 88-89, change:
```tsx
// Before
{t("orderNumber")}: #{order.id}

// After
{t("orderNumber")}: {order.order_code || `#${order.id.slice(0, 8)}`}
```

### 3. Customer Order Detail
**File:** `frontend/app/[locale]/(main)/orders/[id]/page.tsx`

Update header to show order_code instead of order.id.

### 4. Admin Orders List
**File:** `frontend/app/admin/(protected)/orders/page.tsx`

Line 107, change:
```tsx
// Before
{order.id}

// After
{order.order_code || order.id.slice(0, 8)}
```

Also update search filter (line 47) to include order_code:
```tsx
const matchSearch =
  (order.order_code?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
  o.id.toLowerCase().includes(search.toLowerCase()) ||
  // ... rest
```

### 5. Admin Order Detail
**File:** `frontend/app/admin/(protected)/orders/[id]/page.tsx`

Update order code display in header.

## Todo
- [ ] Add order_code to Order interface in types/api.ts
- [ ] Update customer orders list page
- [ ] Update customer order detail page
- [ ] Update admin orders list page
- [ ] Update admin order detail page
- [ ] Update search to include order_code
- [ ] Test all pages display correctly

## Notes
- Fallback to truncated UUID (`order.id.slice(0,8)`) for orders without code
- Search should match both order_code and order.id for backwards compatibility
- Consider adding i18n key for "Mã đơn hàng" if not exists
