---
title: Banner Slider Shared Overlay
status: pending
priority: high
created: 2026-05-24
planDir: plans/260524-0042-banner-slider-shared-overlay
blockedBy: []
blocks: []
---

# Banner Slider Shared Overlay

Fix animation bug (text block di chuyển khi chuyển slide) và WYSIWYG mismatch giữa admin preview/storefront bằng cách tạo shared component.

## Overview

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Shared Overlay Component](phase-01-shared-overlay.md) | pending | 30 min |

**Total:** ~30 min

## Context

- **Brainstorm:** `plans/reports/brainstorm-260524-0042-banner-slider-shared-overlay.md`
- **Related:** `plans/260524-0010-banner-slider-homepage` (completed)

## Problem

1. **Animation Bug:** `transition-all` trên single overlay → text di chuyển khi chuyển slide
2. **WYSIWYG Mismatch:** Admin preview và storefront có khác biệt nhỏ (transition, text size)

## Solution

Extract `SlideOverlay` shared component + render all slides' overlays với opacity fade.

## Files

| File | Action |
|------|--------|
| `frontend/components/shared/slide-overlay.tsx` | CREATE |
| `frontend/components/storefront/banner-slider.tsx` | UPDATE |
| `frontend/components/admin/widgets/banner-slider-preview.tsx` | UPDATE |

## Success Criteria

- [ ] Text block không di chuyển khi chuyển slide
- [ ] Admin preview = storefront rendering
- [ ] Fade animation 300ms smooth
- [ ] CTA links work on storefront
- [ ] Responsive sizing preserved
