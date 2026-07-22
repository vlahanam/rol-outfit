# Banner Slider Homepage Integration

**Date:** 2026-05-24  
**Status:** Completed  
**Duration:** ~2 hours

## Summary

Integrated banner slider into storefront homepage across 3 phases: server-side API utilities with ISR caching, interactive client-side component with auto-rotate/swipe/pause-on-hover, and homepage integration with fallback rendering.

## Key Changes

- **New file:** `frontend/lib/api-server.ts` - Server-side API wrapper with ISR caching (60s revalidation)
- **New file:** `frontend/components/storefront/banner-slider.tsx` - Interactive carousel with Swiper.js
- **Modified:** `frontend/app/[locale]/(main)/page.tsx` - Integrated slider with error boundary fallback
- **New types:** `BannerSlider` API response schema in `frontend/types/api.ts`

## Technical Decisions

1. **ISR Caching:** 60-second revalidation balances stale content risk against API load. Server-side fetching avoids client waterfall delays.

2. **Swiper Configuration:** Auto-rotate (5s), pause-on-hover, touch swipe, centered slides. Effect set to "coverflow" for visual depth but can swap to "fade" if needed.

3. **Fallback Strategy:** Renders nothing if fetch fails (no hardcoded placeholder) to keep homepage clean. Future: add admin-configurable default slides.

## Issues Resolved

- **Critical:** Env var mismatch - code used `API_URL` but `.env` defines `INTERNAL_API_URL`. Fixed to use correct var during code review.
- **Linter auto-fix:** Ternary expression formatting corrected automatically before commit.

## Impact

- Homepage now displays active banner slides from admin panel
- No performance regression (ISR caching prevents repeated API calls)
- Graceful degradation if API unavailable

## Concerns

- `cta_link` validation occurs client-side only; code review flagged as potential security enhancement (defer to phase: admin-only access, low risk)
- Placeholder handling (currently hidden) should be revisited if visibility patterns change

## Next Steps

- Monitor ISR revalidation timing in production
- Consider A/B testing carousel effects (coverflow vs fade)
- Add telemetry for banner interaction rates
