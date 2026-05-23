# Brainstorm: Text Block Positioning for Banner Slider

**Date:** 2026-05-23
**Status:** Approved → Ready for Planning

## Problem Statement

Widget editor tại `/admin/widgets/{id}/edit` cần cho phép:
- Di chuyển vị trí text block trên banner slide
- Điều chỉnh bằng slider X/Y
- Lưu vị trí vào database

## Chosen Approach: Simple X/Y Position

**Rationale:** User yêu cầu "cơ bản" — 2 slider đơn giản đáp ứng đủ, tránh over-engineering.

## Data Model

```typescript
// frontend/types/api.ts
export interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  // NEW fields:
  text_x?: number;      // 0-100 (%), default: 0
  text_y?: number;      // 0-100 (%), default: 100
  font_scale?: number;  // 0.5-2.0, default: 1.0
}
```

Database: JSONB metadata — no migration needed.

## UI Components

| Component | Action |
|-----------|--------|
| `components/ui/slider.tsx` | NEW — install shadcn slider |
| `banner-slider-editor.tsx` | Add 3 sliders |
| `banner-slider-preview.tsx` | Dynamic position via style |

## Implementation Steps

1. Install shadcn slider: `npx shadcn@latest add slider`
2. Update `BannerSlide` type với 3 optional fields
3. Update `defaultSlide()` với defaults
4. Add `SliderField` component
5. Update `BannerSliderEditor` render sliders
6. Update `BannerSliderPreview` apply dynamic position

## Key Files

- `frontend/types/api.ts`
- `frontend/components/admin/widgets/banner-slider-editor.tsx`
- `frontend/components/admin/widgets/banner-slider-preview.tsx`
- `frontend/components/ui/slider.tsx` (new)

## Backward Compatibility

All new fields optional + có defaults → existing data vẫn hoạt động.

## Success Criteria

- Slider X di chuyển text trái-phải real-time
- Slider Y di chuyển text trên-dưới
- Font scale thay đổi size
- Lưu/load đúng từ database
