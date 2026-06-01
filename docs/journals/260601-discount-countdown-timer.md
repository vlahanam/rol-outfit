# Discount Countdown Timer Implementation

**Date:** 2026-06-01
**Feature:** Product detail page countdown timer for active discounts

## Summary

Added real-time countdown timer showing time remaining until discount expires on product detail page.

## Changes

| File | Action |
|------|--------|
| `frontend/components/product/discount-countdown.tsx` | Created |
| `frontend/app/[locale]/(main)/product/[id]/page.tsx` | Modified |

## Key Decisions

- **Format:** `2d 3h 15m` (compact, international) — adds seconds when < 1h remaining
- **Update interval:** 60s normally, 1s when < 1h — balances UX with performance
- **Expiry handling:** Client-side state update, shows "Đã hết hạn khuyến mãi"
- **Hydration:** Used `mounted` state to prevent SSR mismatch

## Bug Fixed During Review

Critical useEffect dependency issue: `timeLeft?.total` in deps array caused interval proliferation. Fixed by using `useRef` for interval tracking and threshold detection.

## Technical Notes

- Uses `useRef` for stable callback and interval management
- Key prop forces remount when variant discount changes
- Backend already enforces pricing; countdown is purely cosmetic

## Related

- Plan: `plans/260601-2238-discount-countdown/`
- Extends: `plans/260509-1150-product-discount/` (completed)
