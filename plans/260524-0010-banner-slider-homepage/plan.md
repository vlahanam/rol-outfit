---
title: Banner Slider Homepage Integration
status: completed
priority: high
created: 2026-05-24
completed: 2026-05-24
planDir: plans/260524-0010-banner-slider-homepage
blockedBy: []
blocks: []
---

# Banner Slider Homepage Integration

Tích hợp widget banner slider từ admin vào homepage storefront với auto-rotate, navigation, và swipe gestures.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Server-side API Utility](phase-01-server-api.md) | completed | 15 min |
| 2 | [Banner Slider Component](phase-02-banner-slider-component.md) | completed | 45 min |
| 3 | [Homepage Integration](phase-03-homepage-integration.md) | completed | 20 min |

**Total:** ~1.5 hours

## Context

- **Brainstorm:** `plans/reports/brainstorm-260524-0010-banner-slider-homepage.md`
- **Predecessor:** `plans/260520-2325-banner-slider-editor` (completed)
- **Backend:** Public API `GET /api/v1/widgets` đã có, filter `status=ACTIVE`

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data fetching | Server-side ISR (60s) | SEO + performance |
| Auto-rotate | 5 giây | Balanced read time |
| Swipe | Native touch events | No external lib needed |
| Approach | Direct Integration | KISS - scope chỉ banner slider |

## Architecture

```
Homepage (Server Component)
    │
    ├─ fetchWidgets() via api-server.ts
    │   └─ GET /api/v1/widgets → filter type=banner-slider
    │
    └─ <BannerSlider slides={...} />
            ├─ Auto-rotate (5s interval)
            ├─ Dot navigation
            ├─ Arrow navigation  
            ├─ Swipe gestures (mobile)
            └─ Pause on hover
```

## Files

| File | Action | Phase |
|------|--------|-------|
| `frontend/lib/api-server.ts` | Create | 1 |
| `frontend/components/storefront/banner-slider.tsx` | Create | 2 |
| `frontend/app/[locale]/(main)/page.tsx` | Modify | 3 |

## Success Criteria

- [x] Banner từ admin hiển thị trên homepage
- [x] Auto-rotate 5s hoạt động
- [x] Swipe gestures on mobile
- [x] Pause on hover
- [x] No CLS (layout shift)
- [x] Server-rendered cho SEO

## Edge Cases

| Case | Handling |
|------|----------|
| No active widget | Skip section, render other content |
| Empty slides | Don't render slider |
| Single slide | Hide nav, no auto-rotate |
| Image error | Fallback gradient |
