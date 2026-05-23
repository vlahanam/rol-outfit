---
title: Text Block Positioning for Banner Slider
status: completed
priority: medium
created: 2026-05-23
planDir: plans/260523-2336-text-block-positioning
blockedBy: []
blocks: []
---

# Text Block Positioning for Banner Slider

Thêm khả năng điều chỉnh vị trí text block trên banner slide bằng slider X/Y.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Install Slider & Update Types](phase-01-install-slider-update-types.md) | ✓ done | 10 min |
| 2 | [Add Sliders to Editor](phase-02-editor-sliders.md) | ✓ done | 20 min |
| 3 | [Dynamic Preview Positioning](phase-03-preview-positioning.md) | ✓ done | 15 min |

**Total:** ~45 min

## Context

- **Brainstorm:** [brainstorm-260523-2336-text-block-positioning.md](../reports/brainstorm-260523-2336-text-block-positioning.md)
- **Prior work:** [260520-2325-banner-slider-editor](../260520-2325-banner-slider-editor/plan.md) (completed)

## Key Facts

- Frontend-only changes — no backend/migration needed
- Data lưu trong JSONB `metadata` field đã có
- Backward compatible — new fields optional với defaults

## Files to Modify

| File | Action |
|------|--------|
| `frontend/components/ui/slider.tsx` | NEW (shadcn) |
| `frontend/types/api.ts` | Add 3 fields to BannerSlide |
| `frontend/components/admin/widgets/banner-slider-editor.tsx` | Add sliders |
| `frontend/components/admin/widgets/banner-slider-preview.tsx` | Dynamic position |

## Success Criteria

- [x] Slider X di chuyển text trái-phải real-time
- [x] Slider Y di chuyển text trên-dưới  
- [x] Font scale thay đổi kích thước
- [x] Lưu/load đúng từ database
- [x] Existing slides không bị ảnh hưởng
