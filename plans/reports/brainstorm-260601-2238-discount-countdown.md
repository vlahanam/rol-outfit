# Brainstorm Report: Discount Countdown Feature

**Date**: 2026-06-01
**Problem**: Product discount not showing on shop listing page

## Root Cause Analysis

API response for product `66aec0a2-4d14-43d9-86a6-e86fecfac662`:
- `discount_percent`: 12
- `discount_end_at`: "2026-06-01T03:36:00Z" (expired)
- `sale_price`: 320000 (= default_price, because discount expired)

**Finding**: Backend correctly returns `sale_price = default_price` when discount expires. Frontend correctly hides discount badge when `sale_price == default_price`. The UX issue is that admin page shows discount_percent without indicating it's expired.

## User Request

Display countdown timer showing time remaining until discount expires on product detail page.

## Agreed Solution

### Format
`2d 3h 15m` (short, international style)

### Behavior
- Show countdown next to discount badge
- When countdown reaches 0: display "Đã hết hạn" and hide discount info (client-side update)
- Update interval: every minute (every second when < 1h remaining)

### Components

1. **New**: `frontend/components/product/discount-countdown.tsx`
   - Props: `discountEndAt`, `onExpire` callback
   - Uses `useEffect` + `setInterval` for real-time updates

2. **Modify**: `frontend/app/[locale]/(main)/product/[id]/page.tsx`
   - Add `isExpired` state
   - Conditionally render countdown and expired message

### Risks
- Timezone handling: ensure UTC parsing
- Hydration mismatch: use client-only rendering for countdown

## Next Steps
Create implementation plan via /ck:plan
