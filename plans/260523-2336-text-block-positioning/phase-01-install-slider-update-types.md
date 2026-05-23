# Phase 1: Install Slider & Update Types

**Status:** ✓ completed  
**Effort:** 10 min

## Overview

Cài đặt Shadcn Slider component và cập nhật BannerSlide type với 3 fields mới.

## Steps

### 1.1 Install Shadcn Slider

```bash
cd frontend && npx shadcn@latest add slider
```

Kiểm tra file được tạo tại `frontend/components/ui/slider.tsx`.

### 1.2 Update BannerSlide Type

**File:** `frontend/types/api.ts`

Thêm 3 optional fields vào `BannerSlide` interface:

```typescript
export interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  // Position fields
  text_x?: number;      // 0-100 (%), default: 0 (left)
  text_y?: number;      // 0-100 (%), default: 100 (bottom)
  font_scale?: number;  // 0.5-2.0, default: 1.0
}
```

### 1.3 Update defaultSlide()

**File:** `frontend/components/admin/widgets/banner-slider-editor.tsx`

```typescript
export function defaultSlide(): BannerSlide {
  return {
    id: crypto.randomUUID(),
    image: "",
    label: "",
    title: "",
    description: "",
    cta_text: "",
    cta_link: "",
    text_x: 0,
    text_y: 100,
    font_scale: 1,
  };
}
```

## Validation

- [x] `slider.tsx` exists in `components/ui/`
- [x] TypeScript compiles without errors
- [x] Existing widget edit page still loads
