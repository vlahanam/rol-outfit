# Phase 3: Dynamic Preview Positioning

**Status:** ✓ completed  
**Effort:** 15 min

## Overview

Cập nhật BannerSliderPreview để text block di chuyển theo giá trị X/Y từ slider.

## Steps

### 3.1 Update Preview Component

**File:** `frontend/components/admin/widgets/banner-slider-preview.tsx`

Thay đổi overlay text div từ static positioning sang dynamic:

**Current (line 41-62):**
```tsx
{/* Overlay text — bottom-left */}
<div className="absolute bottom-0 left-0 p-8 space-y-2 max-w-lg">
```

**New:**
```tsx
{/* Overlay text — dynamic position */}
<div
  className="absolute p-8 space-y-2 max-w-lg transition-all duration-200"
  style={{
    left: `${slide?.text_x ?? 0}%`,
    bottom: `${slide?.text_y ?? 100}%`,
    transform: `translateY(${slide?.text_y ?? 100}%)`,
    fontSize: `${(slide?.font_scale ?? 1) * 100}%`,
  }}
>
```

### 3.2 Position Logic Explanation

- `left: X%` — Di chuyển từ trái sang phải
- `bottom: Y%` — Y=100 nghĩa là sát đáy, Y=20 nghĩa là gần đỉnh
- `transform: translateY(Y%)` — Offset để anchor point ở bottom của text block
- `fontSize` — Scale tất cả text trong container

### 3.3 Add Visual Position Indicator (Optional)

Thêm crosshair indicator khi editing:

```tsx
{/* Position indicator (editor only) */}
<div 
  className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-50"
  style={{
    left: `${slide?.text_x ?? 0}%`,
    bottom: `${slide?.text_y ?? 100}%`,
  }}
/>
```

## Validation

- [x] Kéo slider X → text di chuyển trái-phải trong preview
- [x] Kéo slider Y → text di chuyển trên-dưới
- [x] Kéo slider font → text thay đổi kích thước
- [x] Save widget → reload page → position được giữ nguyên
- [x] Existing slides (không có position fields) vẫn hiển thị đúng (fallback defaults)

## Edge Cases

- Text tràn khỏi container → Đã giới hạn X max=80, Y min=20
- Font scale quá lớn → Đã giới hạn max=2x
- Null/undefined values → Fallback với ?? operator
