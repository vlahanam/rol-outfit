# Slide Overlay Component Refactor - Animation Bug Fix

**Date**: 2026-05-24 10:06
**Severity**: Medium
**Component**: Banner Slider (storefront + admin)
**Status**: Resolved

## What Happened

Implemented shared `SlideOverlay` component to eliminate duplication between storefront banner and admin preview. Discovered and fixed animation bug where text overlays were jumping/sliding during transitions.

## The Brutal Truth

Spent 30 minutes chasing a ghost. The animation felt broken because a single overlay div was being repositioned on every slide change while `transition-all` was active — the position change animated separately from the opacity. Frustrating because the visual feedback was subtle enough to miss at first glance but obvious once understood.

## Technical Details

**Root Issue**: Single overlay element changing `text_x` and `text_y` coordinates with `transition-all` enabled caused position to animate unintentionally during slide changes.

**The Fix**: Render ALL overlays simultaneously (hidden with `opacity-0`), each with its own fixed position per slide. Only animate `opacity` on mount/unmount. Position is set once per overlay and never changes during transitions.

```typescript
// Before: Single overlay moving
<motion.div style={{ left: textX, top: textY }} transition={{ all: 0.5s }} />

// After: All overlays present, opacity controls visibility
{slides.map(slide => (
  <motion.div key={slide.id} style={{ left: slide.textX, top: slide.textY }} 
              animate={{ opacity: activeSlide === slide.id ? 1 : 0 }} />
))}
```

## Lessons Learned

1. **Render-all pattern beats single-element state machine** for multi-state animations — avoids coupling position updates with transition effects
2. **WYSIWYG consistency matters** — admin had different defaults (`text_x=0`) than storefront (`text_x=5`); shared component now guarantees parity
3. **Transition specificity prevents side effects** — `transition-opacity` only is safer than `transition-all` when element properties change

## Next Steps

None — this completes the banner slider refactor phase. Ready for production.
