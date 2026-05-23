# Text Block Positioning for Banner Slider

**Date:** 2026-05-23  
**Status:** Completed  
**Duration:** ~45 min

## Summary

Added X/Y position and font scale controls to banner slider widget editor. Text blocks now dynamically position in real-time preview.

## Key Changes

- **New component:** `components/ui/slider.tsx` - Radix slider wrapper
- **Type extension:** `BannerSlide` + `text_x`, `text_y`, `font_scale` (optional, backward compatible)
- **Editor:** 3 slider controls in "Vị trí & Kích thước" section
- **Preview:** Dynamic CSS positioning via inline styles

## Technical Decisions

1. **Manual slider vs shadcn CLI:** Created minimal Radix wrapper since shadcn wasn't initialized. Avoids setup complexity for single component.

2. **Positioning math:** Used `bottom: ${100 - Y}%` formula. Y=100 = bottom, Y=20 = near top. Initial plan had inverted logic (caught in code review).

3. **Slider bounds:** X [0-80%], Y [20-100%] to prevent text overflow. Font scale [0.5-2x] for reasonable range.

## Issues Resolved

- **Critical:** Fixed positioning CSS logic - original `bottom: Y%` + `translateY(Y%)` was incorrect
- **Pre-existing:** Fixed type error in `use-fly-to-cart.ts` (`CSS.escape` truthiness check)

## Impact

- Admin can visually position text on banner slides
- Existing slides unaffected (defaults via nullish coalescing)
- No backend changes needed (JSONB metadata handles new fields)

## Next Steps

- Public storefront banner component needs same positioning logic (currently admin-preview only)
- Consider i18n for slider labels (currently Vietnamese hardcoded)
