---
phase: 1
title: Shared Overlay Component
status: completed
effort: 30 min
---

# Phase 1: Shared Overlay Component

Create `SlideOverlay` shared component và update cả admin preview + storefront để sử dụng.

## Context

- [Brainstorm Report](../reports/brainstorm-260524-0042-banner-slider-shared-overlay.md)
- [Current storefront](../../frontend/components/storefront/banner-slider.tsx)
- [Current admin preview](../../frontend/components/admin/widgets/banner-slider-preview.tsx)

## Requirements

### Functional
- Shared component render: label, title, description, CTA
- Positioning via inline styles từ slide data
- Storefront: fade animation khi chuyển slide
- Admin: single overlay (no animation)

### Non-Functional
- WYSIWYG: identical rendering
- No layout shift on slide change
- 300ms fade transition

## Implementation

### Step 1: Create `SlideOverlay` Component

**File:** `frontend/components/shared/slide-overlay.tsx`

```tsx
"use client";

import Link from "next/link";
import type { BannerSlide } from "@/types/api";

interface SlideOverlayProps {
  slide: BannerSlide;
  isActive?: boolean;
  linkEnabled?: boolean;
  className?: string;
}

export function SlideOverlay({
  slide,
  isActive = true,
  linkEnabled = false,
  className = "",
}: SlideOverlayProps) {
  const positionStyle = {
    left: `${slide.text_x ?? 5}%`,
    bottom: `${100 - (slide.text_y ?? 80)}%`,
    transform: `scale(${slide.font_scale ?? 1})`,
    transformOrigin: "bottom left" as const,
  };

  return (
    <div
      className={`absolute p-6 md:p-8 space-y-2 max-w-lg transition-opacity duration-300 ${
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${className}`}
      style={positionStyle}
    >
      {slide.label && (
        <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
          {slide.label}
        </p>
      )}
      {slide.title && (
        <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight">
          {slide.title}
        </h2>
      )}
      {slide.description && (
        <p className="text-gray-200 text-sm md:text-base">{slide.description}</p>
      )}
      {slide.cta_text && slide.cta_link && (
        <div className="pt-2">
          {linkEnabled ? (
            <Link
              href={slide.cta_link}
              className="inline-block px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {slide.cta_text}
            </Link>
          ) : (
            <span className="inline-block px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg">
              {slide.cta_text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 2: Update Storefront `banner-slider.tsx`

**Changes:**
1. Import `SlideOverlay`
2. Remove inline text rendering (lines 90-124)
3. Render ALL slides' overlays with `isActive` prop

**Replace lines 88-124:**

```tsx
{/* Gradient overlay */}
<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

{/* All slide overlays - only active one visible */}
{slides.map((s, i) => (
  <SlideOverlay
    key={s.id ?? i}
    slide={s}
    isActive={i === activeIndex}
    linkEnabled={true}
  />
))}
```

### Step 3: Update Admin `banner-slider-preview.tsx`

**Changes:**
1. Import `SlideOverlay`
2. Remove inline text rendering (lines 41-71)
3. Single overlay for active slide (no fade animation needed)

**Replace lines 38-71:**

```tsx
{/* Left-to-right gradient so text is always readable */}
<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

{/* Text overlay */}
{slide && (
  <SlideOverlay
    slide={slide}
    isActive={true}
    linkEnabled={false}
  />
)}
```

## Todo

- [ ] Create `frontend/components/shared/slide-overlay.tsx`
- [ ] Update `frontend/components/storefront/banner-slider.tsx`
- [ ] Update `frontend/components/admin/widgets/banner-slider-preview.tsx`
- [ ] Test: switch slides → no text movement
- [ ] Test: admin preview matches storefront
- [ ] Test: CTA links work on storefront

## Verification

```bash
# Start dev server
make up

# Test storefront
# 1. Go to http://localhost/
# 2. Click slide navigation dots
# 3. Verify text fades without moving

# Test admin
# 1. Go to http://localhost/admin/widgets
# 2. Edit banner slider
# 3. Compare preview with storefront
```

## Success Criteria

- Text block fades in/out, không di chuyển
- Admin preview = storefront (WYSIWYG)
- CTA clickable trên storefront
- Responsive text sizing hoạt động
