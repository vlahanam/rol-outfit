---
phase: 01
title: "Implement Discount Countdown"
status: done
priority: P2
effort: 1h
completed: 2026-06-01
---

# Phase 01: Implement Discount Countdown

## Context Links

- Plan: [plan.md](./plan.md)
- Brainstorm: [brainstorm-260601-2238-discount-countdown.md](../reports/brainstorm-260601-2238-discount-countdown.md)
- Product detail page: `frontend/app/[locale]/(main)/product/[id]/page.tsx`
- TypeScript types: `frontend/types/api.ts` (Product, ProductVariant interfaces)

## Overview

Create countdown component and integrate into product detail page price section.

## Key Insights

1. Backend returns `discount_end_at` as ISO8601 UTC string (e.g., `"2026-06-01T03:36:00Z"`)
2. `new Date(isoString)` parses UTC correctly in JS
3. Hydration mismatch: server renders at build time, client renders current time → must use `useEffect` for countdown
4. Product detail already has `isDiscounted` check at line 90: `salePrice < price`

## Requirements

### Functional
- Display countdown next to discount badge when `discount_end_at` exists and discount is active
- Format: `2d 3h 15m` (omit zero units except minutes)
- When < 1 hour: show seconds `0d 0h 45m 30s`
- On expiry: call `onExpire` callback, component shows nothing

### Non-Functional
- No external libraries (vanilla Date math)
- Client-only rendering to avoid hydration mismatch
- Minimal re-renders (update every minute, every second when < 1h)

## Architecture

```
DiscountCountdown
├── Props: { discountEndAt: string | null, onExpire?: () => void }
├── State: timeLeft (object with days/hours/minutes/seconds)
├── Effect: setInterval based on timeLeft (60s or 1s)
└── Render: formatted string or null (expired/no end date)

ProductDetailPage
├── State: isExpired (boolean, default false)
├── Compute: showDiscount = isDiscounted && !isExpired
├── Render: {showDiscount && <DiscountCountdown onExpire={...} />}
└── Fallback: {isExpired && <ExpiredBadge />}
```

## Related Code Files

### Create
- `frontend/components/product/discount-countdown.tsx`

### Modify
- `frontend/app/[locale]/(main)/product/[id]/page.tsx`
  - Line 44: add `isExpired` state
  - Lines 183-191: wrap discount display with `!isExpired` condition
  - Add countdown component after discount badge

## Implementation Steps

### Step 1: Create discount-countdown.tsx

```tsx
"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(endAt: string): TimeLeft {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function formatTimeLeft(t: TimeLeft): string {
  const parts: string[] = [];
  if (t.days > 0) parts.push(`${t.days}d`);
  if (t.hours > 0 || t.days > 0) parts.push(`${t.hours}h`);
  parts.push(`${t.minutes}m`);
  if (t.total < 60 * 60 * 1000) parts.push(`${t.seconds}s`);
  return parts.join(" ");
}

interface Props {
  discountEndAt: string | null;
  onExpire?: () => void;
}

export function DiscountCountdown({ discountEndAt, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!discountEndAt) return;

    const update = () => {
      const t = calcTimeLeft(discountEndAt);
      setTimeLeft(t);
      if (t.total <= 0) onExpire?.();
    };
    update();

    const interval = setInterval(update, timeLeft && timeLeft.total < 60 * 60 * 1000 ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [discountEndAt, onExpire, timeLeft?.total]);

  if (!mounted || !discountEndAt || !timeLeft || timeLeft.total <= 0) return null;

  return (
    <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
      {formatTimeLeft(timeLeft)}
    </span>
  );
}
```

### Step 2: Modify product detail page

**Add state (after line 51):**
```tsx
const [isExpired, setIsExpired] = useState(false);
```

**Add import (line 8):**
```tsx
import { DiscountCountdown } from "@/components/product/discount-countdown";
```

**Modify discount display (lines 183-193):**
```tsx
{isDiscounted && !isExpired && (
  <>
    <span className="text-xl text-gray-400 line-through">
      {formatPrice(price)}
    </span>
    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
      -{Math.round((1 - salePrice / price) * 100)}%
    </span>
    <DiscountCountdown
      discountEndAt={variant?.discount_end_at ?? product?.discount_end_at}
      onExpire={() => setIsExpired(true)}
    />
  </>
)}
{isExpired && (
  <span className="text-sm text-orange-500 font-medium">
    Đã hết hạn khuyến mãi
  </span>
)}
```

## Todo List

- [x] Create `discount-countdown.tsx` component
- [x] Add `isExpired` state to product detail page
- [x] Import and integrate countdown component
- [x] Update discount display conditionals
- [x] Test with active discount (mock `discount_end_at` to near future)
- [x] Test expiry behavior
- [x] Verify no hydration warnings in console

## Success Criteria

- Countdown displays for products with `discount_end_at`
- Format matches `2d 3h 15m` (adds seconds when < 1h)
- Timer updates in real-time
- "Đã hết hạn khuyến mãi" appears on expiry
- No console errors or hydration mismatches

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Hydration mismatch | Use `mounted` state, only render after useEffect |
| Timezone issues | Backend returns UTC ISO8601, `new Date()` parses correctly |
| Memory leak | Clear interval in useEffect cleanup |
| Interval drift | Re-calculate from end time each tick, don't accumulate |

## Security Considerations

- No user input processed
- Display only, no data mutation
- Expiry is cosmetic; backend enforces actual pricing
