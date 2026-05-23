# Code Review: Banner Slider Homepage Integration

**Date:** 2026-05-24  
**Reviewer:** code-reviewer  
**Files Reviewed:**
- `frontend/lib/api-server.ts` (new)
- `frontend/components/storefront/banner-slider.tsx` (new)
- `frontend/app/[locale]/(main)/page.tsx` (modified)

---

## Summary

Overall implementation is solid. Clean component architecture, good separation between server fetch utility and client component. A few issues need attention before production.

---

## Critical Issues

### 1. [SECURITY] cta_link allows arbitrary URLs (potential open redirect / XSS)

**File:** `banner-slider.tsx:114-120`

```tsx
<Link href={slide.cta_link} ...>
```

`cta_link` comes from admin-provided widget metadata stored in JSONB. No validation ensures it:
- Is a relative path (preventing open redirects to malicious sites)
- Doesn't use `javascript:` protocol (XSS vector)

**Impact:** Admins with widget edit access could inject malicious links.

**Fix:**
```tsx
const isValidCtaLink = (link: string) => {
  if (!link) return false;
  // Allow relative paths and same-origin absolute paths
  if (link.startsWith('/')) return true;
  try {
    const url = new URL(link);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

// In component:
{slide.cta_text && slide.cta_link && isValidCtaLink(slide.cta_link) && (
  <Link href={slide.cta_link} ...>
```

---

### 2. [ENV] INTERNAL_API_URL not defined in docker-compose

**File:** `api-server.ts:3`

```ts
const API_BASE = process.env.INTERNAL_API_URL || "http://backend:8080/api/v1";
```

Docker compose defines `API_URL` but code checks `INTERNAL_API_URL`. Fallback works but inconsistent naming causes confusion and potential deployment issues.

**Impact:** Works in dev due to fallback, may fail in production if env var names diverge.

**Fix:** Either:
- Rename to `API_URL` to match docker-compose, OR
- Add `INTERNAL_API_URL` to docker-compose.yml frontend service

---

## High Priority

### 3. [PERFORMANCE] goNext dependency causes interval churn

**File:** `banner-slider.tsx:41-45`

```tsx
useEffect(() => {
  if (!showControls || isPaused) return;
  const timer = setInterval(goNext, autoPlayInterval);
  return () => clearInterval(timer);
}, [showControls, isPaused, goNext, autoPlayInterval]);
```

`goNext` depends on `activeIndex`, which changes every slide. This recreates the interval every 5 seconds (on every slide change), causing brief visual stutter on transition.

**Impact:** Minor UX jitter, unnecessary cleanup/setup cycles.

**Fix:** Use functional update to remove activeIndex dependency:

```tsx
const goToSlide = useCallback((index: number) => {
  setActiveIndex(prev => (index + slides.length) % slides.length);
}, [slides.length]);

const goNext = useCallback(() => {
  setActiveIndex(prev => (prev + 1) % slides.length);
}, [slides.length]);

const goPrev = useCallback(() => {
  setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
}, [slides.length]);
```

---

### 4. [ERROR HANDLING] Silent null return hides fetch errors

**File:** `api-server.ts:17-27`

```ts
try {
  const res = await fetch(...);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
} catch {
  return null;
}
```

All errors (network, parse, non-2xx) silently return null. No logging or error reporting.

**Impact:** Production debugging is difficult; no visibility into API failures.

**Fix:**
```ts
} catch (error) {
  console.error(`[api-server] Failed to fetch ${path}:`, error);
  return null;
}
```

Also consider throwing for non-recoverable errors vs returning null for "not found".

---

## Medium Priority

### 5. [LINTING] Ternary expression as statement

**File:** `banner-slider.tsx:57`

```tsx
diff > 0 ? goNext() : goPrev();
```

ESLint warns: "Expected an assignment or function call and instead saw an expression"

**Fix:**
```tsx
if (diff > 0) {
  goNext();
} else {
  goPrev();
}
```

---

### 6. [ACCESSIBILITY] Missing role and live region for slider

**File:** `banner-slider.tsx:66-73`

Screen readers cannot announce slide changes. Missing:
- `role="region"` or `role="complementary"` on container
- `aria-live="polite"` for announcing current slide
- `aria-roledescription="carousel"` for semantic clarity

**Fix:**
```tsx
<div
  role="region"
  aria-roledescription="carousel"
  aria-label="Banner slides"
  className="relative w-full overflow-hidden rounded-xl"
  ...
>
  {/* Add hidden live region */}
  <div aria-live="polite" className="sr-only">
    Slide {activeIndex + 1} of {slides.length}
  </div>
```

---

### 7. [TYPE] Unsafe type coercion

**File:** `page.tsx:17-19`

```tsx
const slides = bannerWidget
  ? ((bannerWidget.metadata as unknown as BannerSliderMetadata)?.slides ?? [])
  : [];
```

Double cast (`as unknown as`) bypasses TypeScript safety. If metadata shape differs, runtime errors occur.

**Fix:** Add runtime validation or use Zod schema:
```ts
function isBannerSliderMetadata(m: unknown): m is BannerSliderMetadata {
  return m !== null && typeof m === 'object' && 'slides' in m && Array.isArray((m as any).slides);
}

const slides = bannerWidget?.metadata && isBannerSliderMetadata(bannerWidget.metadata)
  ? bannerWidget.metadata.slides
  : [];
```

---

### 8. [CONFIG] Image domains not configured for widget images

**File:** `next.config.ts:8-13`

Only `images.unsplash.com` is whitelisted. Banner images from other domains (e.g., S3, CDN, or admin uploads) will fail to load.

**Impact:** Production banner images likely fail unless all from Unsplash.

**Fix:** Add your upload/CDN domain:
```ts
remotePatterns: [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "your-cdn.example.com" },
  { protocol: "http", hostname: "localhost" }, // dev uploads
],
```

---

## Low Priority

### 9. [STYLE] Inconsistent default values

**File:** `banner-slider.tsx` vs `banner-slider-preview.tsx`

| Property | Storefront | Preview |
|----------|------------|---------|
| text_x default | 5 | 0 |
| text_y default | 80 | 100 |

**Impact:** Preview in admin doesn't match storefront rendering.

**Fix:** Extract to shared constants or ensure both use same defaults.

---

### 10. [EDGE CASE] No keyboard navigation

Arrow keys and Tab navigation not implemented for the slider. Low priority since this is supplementary content, not primary navigation.

---

## Positive Observations

1. **Clean component architecture** - Server fetch utility separated from client component
2. **Good empty state handling** - Returns null for empty slides, hides controls for single slide
3. **Touch support** - Swipe gestures implemented with reasonable threshold
4. **Pause on hover** - Good UX for users wanting to read content
5. **Next.js best practices** - Uses `priority` for LCP image, proper `fill` layout
6. **Type definitions** - Well-defined BannerSlide interface with optional positioning props

---

## Checklist

- [x] Concurrency: No shared mutable state issues (refs are component-scoped)
- [ ] Error boundaries: Silent failures need logging
- [x] API contracts: Types match expected backend response shape
- [x] Backwards compatibility: New files, no breaking changes
- [ ] Input validation: cta_link needs sanitization
- [x] Auth/authz: Widgets are public, no auth needed
- [x] N+1 queries: Single fetch with limit=50, no loop
- [x] Data leaks: No PII exposure

---

## Recommended Actions

1. **[CRITICAL]** Add cta_link validation before rendering
2. **[CRITICAL]** Align INTERNAL_API_URL env var naming
3. **[HIGH]** Fix goNext interval churn with functional setState
4. **[HIGH]** Add error logging to api-server
5. **[MEDIUM]** Fix ESLint warning in touch handler
6. **[MEDIUM]** Add aria attributes for accessibility
7. **[MEDIUM]** Configure Next.js image domains for production
8. **[LOW]** Align default positioning values between components
