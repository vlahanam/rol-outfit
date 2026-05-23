# Brainstorm: Banner Slider Shared Overlay

**Date:** 2026-05-24
**Status:** Approved

## Problem Statement

1. **Animation Bug:** Text block di chuyển khi chuyển slide (do `transition-all` trên single overlay có position thay đổi)
2. **WYSIWYG Mismatch:** Admin preview và storefront render khác nhau (transition timing, text size, CTA element)

## Evaluated Approaches

### ❌ Pre-render HTML on Save
- Store pre-rendered HTML in DB
- Frontend inject via dangerouslySetInnerHTML
- **Rejected:** XSS risk, responsive issues, CSS isolation, premature optimization

### ✅ Shared Component (Chosen)
- Extract `SlideOverlay` component dùng chung
- Both admin preview + storefront use same code
- **Why:** Simpler, safer, guaranteed WYSIWYG by definition

## Final Solution

### 1. Create Shared Component

```tsx
// frontend/components/shared/slide-overlay.tsx
interface SlideOverlayProps {
  slide: BannerSlide;
  isActive?: boolean;      // For fade animation
  linkEnabled?: boolean;   // CTA as Link or span
}
```

**Renders:**
- Label (yellow badge)
- Title (responsive sizing)
- Description
- CTA button (Link when enabled, span otherwise)

**Positioning:**
- `left: ${slide.text_x}%`
- `bottom: ${100 - slide.text_y}%`
- `transform: scale(${slide.font_scale})`

### 2. Fix Animation Bug

**Before (broken):**
```tsx
<SlideOverlay slide={slides[activeIndex]} />
```

**After (fixed):**
```tsx
{slides.map((slide, i) => (
  <SlideOverlay 
    slide={slide}
    isActive={i === activeIndex}
  />
))}
```

- Each slide has own overlay at own position
- Active slide: `opacity-100`
- Inactive: `opacity-0 pointer-events-none`
- No position animation - only fade

### 3. Update Consumers

**Storefront `banner-slider.tsx`:**
- Import `SlideOverlay`
- Render all slides' overlays with fade
- Remove inline text rendering

**Admin `banner-slider-preview.tsx`:**
- Import `SlideOverlay`
- Single overlay (no animation needed in preview)
- Remove inline text rendering

## Files to Modify

| File | Action |
|------|--------|
| `frontend/components/shared/slide-overlay.tsx` | CREATE |
| `frontend/components/storefront/banner-slider.tsx` | UPDATE |
| `frontend/components/admin/widgets/banner-slider-preview.tsx` | UPDATE |

## Success Criteria

1. Text block không di chuyển khi chuyển slide
2. Admin preview = storefront rendering (WYSIWYG)
3. Fade animation smooth (300ms)
4. CTA links work correctly on storefront
5. Responsive text sizing preserved

## Risks

- CSS specificity conflicts between admin/storefront contexts → mitigate with Tailwind utility classes only
- Animation timing differences → unified 300ms transition

## Next Steps

Create implementation plan via `/ck:plan`
