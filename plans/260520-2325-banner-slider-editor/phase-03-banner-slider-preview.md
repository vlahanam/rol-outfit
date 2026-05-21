---
phase: 3
title: Banner Slider Preview Component
status: completed
effort: 30 min
---

# Phase 3 – Banner Slider Preview Component

## Context Links
- `frontend/types/api.ts` — `BannerSlide`
- Reference image: hero banner với overlay text góc trái (label vàng → title lớn → description → CTA button)

## Overview

Live preview component hiển thị đúng như banner sẽ render trên storefront:
- Ảnh full-width, aspect-ratio 16:9 (hoặc cố định height ~480px)
- Overlay text bottom-left: label vàng → title trắng lớn → description trắng → CTA button trắng/nền tối
- Slide indicators chấm tròn ở bottom-center
- Điều hướng: click tab editor → preview cập nhật

## Related Code Files

**Create:**
- `frontend/components/admin/widgets/banner-slider-preview.tsx`

## Implementation Steps

### 1. Create `frontend/components/admin/widgets/banner-slider-preview.tsx`

```tsx
"use client";

import Image from "next/image";
import type { BannerSlide } from "@/types/api";

interface Props {
  slides: BannerSlide[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function BannerSliderPreview({ slides, activeIndex, onActiveChange }: Props) {
  const slide = slides[activeIndex];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
      <div className="relative w-full overflow-hidden rounded-xl bg-gray-200" style={{ aspectRatio: "16/6" }}>
        {/* Background image */}
        {slide?.image ? (
          <Image
            src={slide.image}
            alt={slide.title || "Banner"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
            <span className="text-sm text-gray-500">Chưa có ảnh</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        {/* Text overlay — bottom-left */}
        <div className="absolute bottom-0 left-0 p-8 space-y-2 max-w-lg">
          {slide?.label && (
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
              {slide.label}
            </p>
          )}
          {slide?.title && (
            <h2 className="text-white text-3xl font-bold leading-tight">
              {slide.title}
            </h2>
          )}
          {slide?.description && (
            <p className="text-gray-200 text-sm">{slide.description}</p>
          )}
          {slide?.cta_text && (
            <div className="pt-2">
              <span className="inline-block px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg">
                {slide.cta_text}
              </span>
            </div>
          )}
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onActiveChange(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIndex ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Todo List

- [x] Create `banner-slider-preview.tsx`
- [x] Background image with Next.js `Image` fill
- [x] Gradient overlay (left-to-right)
- [x] Text overlay: label (yellow), title (white bold), description (gray-200), CTA (white button)
- [x] Dot indicators at bottom-center (clickable → change activeIndex)
- [x] Empty state when no image

## Success Criteria

- Preview cập nhật realtime khi edit text hoặc upload ảnh
- Gradient overlay đảm bảo text đọc được trên mọi loại ảnh
- Dot indicators reflect active slide
- Aspect ratio 16:6 consistent (tương đương banner storefront)
