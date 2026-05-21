---
title: Banner Slider Editor – Image Upload + Overlay Text + Live Preview
status: completed
priority: high
created: 2026-05-20
planDir: plans/260520-2325-banner-slider-editor
blockedBy: []
blocks: []
---

# Banner Slider Editor

Thêm banner slider editor vào trang chỉnh sửa widget với type `banner-slider`:
- Upload ảnh cho từng slide
- Nhập overlay text (label, title, description, CTA) theo vị trí như ảnh tham khảo
- Live preview hiển thị như banner thật

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Types & API Update](phase-01-types-api.md) | completed | 10 min |
| 2 | [Banner Slider Editor Component](phase-02-banner-slider-editor.md) | completed | 40 min |
| 3 | [Banner Slider Preview Component](phase-03-banner-slider-preview.md) | completed | 30 min |
| 4 | [Wire into Edit Page](phase-04-wire-edit-page.md) | completed | 20 min |

## Key Facts

- **Backend đã sẵn sàng:** `UpdateWidgetRequest.Metadata json.RawMessage` đã có, service đã lưu metadata, DTO đã trả về metadata — **zero backend changes needed**
- **ImageUploader component** đã có tại `frontend/components/admin/image-uploader.tsx`
- **Upload API** `POST /api/v1/uploads` đã hoạt động qua `api.uploads.upload(file)`
- Widget hiện tại load từ `api.adminWidgets.get(id)` và trả về `metadata: Record<string, unknown> | null`

## Metadata JSON Shape

```json
{
  "slides": [
    {
      "id": "uuid",
      "image": "https://...",
      "label": "Giảm giá lên đến 50%",
      "title": "Bộ Sưu Tập Mùa Hè 2026",
      "description": "Khám phá những xu hướng thời trang mới nhất",
      "cta_text": "Mua Ngay",
      "cta_link": "/collections/summer"
    }
  ]
}
```

## Scope

**Frontend only — 4 files:**

| File | Action |
|------|--------|
| `frontend/types/api.ts` | Add `BannerSlide`, `BannerSliderMetadata`; update `UpdateWidgetPayload` |
| `frontend/components/admin/widgets/banner-slider-editor.tsx` | NEW — Slide list + per-slide image/text editor |
| `frontend/components/admin/widgets/banner-slider-preview.tsx` | NEW — Live preview component |
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | Load/save metadata; show editor+preview when type=banner-slider |
