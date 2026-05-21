---
phase: 2
title: Banner Slider Editor Component
status: completed
effort: 40 min
---

# Phase 2 – Banner Slider Editor Component

## Context Links
- `frontend/components/admin/image-uploader.tsx` — reuse for image upload
- `frontend/types/api.ts` — `BannerSlide`, `BannerSliderMetadata`

## Overview

Component quản lý danh sách slides: thêm/xóa slide, upload ảnh, nhập text overlay.
Props nhận `slides` + `onChange` (controlled component pattern).

## Related Code Files

**Create:**
- `frontend/components/admin/widgets/banner-slider-editor.tsx`

## Component Interface

```typescript
interface BannerSliderEditorProps {
  slides: BannerSlide[];
  onChange: (slides: BannerSlide[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}
```

## UI Layout

```
┌─────────────────────────────────────────────┐
│ Slides  [+ Thêm Slide]                       │
├─────────────────────────────────────────────┤
│ ● Slide 1  ○ Slide 2  ○ Slide 3             │  ← tab selector
├─────────────────────────────────────────────┤
│ [Image Upload 16:9]                          │
│                                             │
│ Label (màu vàng)  [___________________]     │
│ Tiêu đề lớn       [___________________]     │
│ Mô tả             [___________________]     │
│ Nút CTA text      [___________________]     │
│ Nút CTA link      [___________________]     │
│                                [Xóa Slide]  │
└─────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create `frontend/components/admin/widgets/banner-slider-editor.tsx`

```tsx
"use client";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { BannerSlide } from "@/types/api";
import { v4 as uuidv4 } from "uuid"; // or crypto.randomUUID()

interface Props {
  slides: BannerSlide[];
  onChange: (slides: BannerSlide[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

const DEFAULT_SLIDE = (): BannerSlide => ({
  id: crypto.randomUUID(),
  image: "",
  label: "",
  title: "",
  description: "",
  cta_text: "",
  cta_link: "",
});

export function BannerSliderEditor({ slides, onChange, activeIndex, onActiveChange }: Props) {
  const slide = slides[activeIndex];

  const update = (patch: Partial<BannerSlide>) => {
    onChange(slides.map((s, i) => (i === activeIndex ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    const next = [...slides, DEFAULT_SLIDE()];
    onChange(next);
    onActiveChange(next.length - 1);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== activeIndex);
    onChange(next);
    onActiveChange(Math.min(activeIndex, next.length - 1));
  };

  return (
    <div className="space-y-4">
      {/* Slide tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onActiveChange(i)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              i === activeIndex
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            Slide {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addSlide}
          className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Thêm Slide
        </button>
      </div>

      {/* Slide editor */}
      {slide && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <ImageUploader
            label="Ảnh Banner (tỉ lệ 16:9)"
            value={slide.image}
            onChange={(url) => update({ image: url })}
            required
          />

          <div className="grid gap-3">
            <Field label="Label nhỏ (màu vàng)" value={slide.label} onChange={(v) => update({ label: v })} placeholder="Vd: Giảm giá lên đến 50%" />
            <Field label="Tiêu đề lớn" value={slide.title} onChange={(v) => update({ title: v })} placeholder="Vd: Bộ Sưu Tập Mùa Hè 2026" />
            <Field label="Mô tả" value={slide.description} onChange={(v) => update({ description: v })} placeholder="Vd: Khám phá những xu hướng thời trang mới nhất" />
            <Field label="Nút CTA – Văn bản" value={slide.cta_text} onChange={(v) => update({ cta_text: v })} placeholder="Vd: Mua Ngay" />
            <Field label="Nút CTA – Đường dẫn" value={slide.cta_link} onChange={(v) => update({ cta_link: v })} placeholder="Vd: /collections/summer" />
          </div>

          {slides.length > 1 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={removeSlide}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Xóa slide này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
```

## Todo List

- [x] Create `banner-slider-editor.tsx` with slide tab selector
- [x] ImageUploader integration per slide
- [x] Text fields: label, title, description, cta_text, cta_link
- [x] Add/remove slide logic
- [x] Extract `defaultSlide()` as exported function (DRY fix)

## Success Criteria

- Can add up to N slides
- Switching tabs shows correct slide data
- Image upload works via existing `ImageUploader`
- Text changes reflected in `onChange` callback
- Cannot remove last slide
