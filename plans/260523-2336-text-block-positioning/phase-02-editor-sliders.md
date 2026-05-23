# Phase 2: Add Sliders to Editor

**Status:** ✓ completed  
**Effort:** 20 min

## Overview

Thêm 3 slider controls vào BannerSliderEditor để điều chỉnh text_x, text_y, font_scale.

## Steps

### 2.1 Import Slider Component

**File:** `frontend/components/admin/widgets/banner-slider-editor.tsx`

```typescript
import { Slider } from "@/components/ui/slider";
```

### 2.2 Add SliderField Component

Thêm helper component bên dưới `SlideField`:

```typescript
function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        {label}: {value}{unit}
      </label>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
```

### 2.3 Add Sliders to Editor JSX

Thêm section mới sau các text fields, trước nút "Xóa slide":

```tsx
{/* Position & Size controls */}
<div className="border-t border-gray-200 pt-4 mt-4">
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
    Vị trí & Kích thước
  </p>
  <div className="grid gap-4">
    <SliderField
      label="Vị trí ngang (X)"
      value={slide.text_x ?? 0}
      onChange={(v) => update({ text_x: v })}
      min={0}
      max={80}
      unit="%"
    />
    <SliderField
      label="Vị trí dọc (Y)"
      value={slide.text_y ?? 100}
      onChange={(v) => update({ text_y: v })}
      min={20}
      max={100}
      unit="%"
    />
    <SliderField
      label="Tỉ lệ chữ"
      value={slide.font_scale ?? 1}
      onChange={(v) => update({ font_scale: v })}
      min={0.5}
      max={2}
      step={0.1}
      unit="x"
    />
  </div>
</div>
```

**Note:** X max=80 và Y min=20 để text không bị tràn khỏi màn hình.

## Validation

- [x] 3 sliders hiển thị trong editor
- [x] Kéo slider cập nhật giá trị real-time
- [x] TypeScript compiles
