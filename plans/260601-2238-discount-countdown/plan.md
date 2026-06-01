---
title: "Discount Countdown Timer"
description: "Display countdown timer for active discounts on product detail page, showing time remaining until expiry"
status: done
priority: P2
effort: 1h
branch: develop
tags: [frontend, product, discount, ux]
created: 2026-06-01
completed: 2026-06-01
blockedBy: []
blocks: []
---

# Plan: Discount Countdown Timer

## Overview

Add real-time countdown timer next to discount badge on product detail page. Shows remaining time in format `2d 3h 15m`. When countdown reaches 0, display "Đã hết hạn" and hide discount info client-side.

## Context

- Brainstorm report: `plans/reports/brainstorm-260601-2238-discount-countdown.md`
- Related completed plan: `plans/260509-1150-product-discount/`
- Backend already returns `discount_end_at` in product/variant DTOs

## Goals

1. Show countdown timer when discount is active and has `discount_end_at`
2. Format: `2d 3h 15m` (compact international style)
3. Update interval: every minute (every second when < 1h remaining)
4. On expire: show "Đã hết hạn", hide discount badge/strikethrough price
5. Handle SSR hydration mismatch (client-only countdown rendering)

## Non-Goals (YAGNI)

- Countdown on shop listing page (only product detail)
- Sound/notification on expiry
- Server-side expiry handling (already implemented)
- Admin countdown display

## Phases

| Phase | File | Status |
|-------|------|--------|
| 01 | [phase-01-implement-countdown.md](./phase-01-implement-countdown.md) | done |

## Files Changed

| File | Action |
|------|--------|
| `frontend/components/product/discount-countdown.tsx` | Create |
| `frontend/app/[locale]/(main)/product/[id]/page.tsx` | Modify |

## Success Criteria

- [x] Countdown displays correctly for products with active discount + end date
- [x] Timer updates in real-time (minute intervals, second intervals < 1h)
- [x] "Đã hết hạn" displays when countdown reaches 0
- [x] No hydration mismatch warnings in console
- [x] Works for both product-level and variant-level discounts
