# Brainstorm Report: Banner Slider Homepage Integration

**Date:** 2026-05-24
**Status:** Approved

## Problem Statement

Widget banner slider được cấu hình trong admin (`/admin/widgets/{id}/edit`) nhưng chưa hiển thị trên homepage. Cần tích hợp để admin có thể quản lý banner và thay đổi hiển thị trên storefront.

## Requirements

- Auto-rotate slides (5 giây interval)
- Navigation: dots + arrows
- Mobile: swipe gestures
- Pause on hover
- Server-side rendering (ISR 60s) cho SEO
- Scope: Banner slider only

## Evaluated Approaches

### A: Direct Integration (CHOSEN)

**Pros:** Đơn giản, scope nhỏ (~3 files), ~2-3h
**Cons:** Không có generic widget renderer

### B: Widget Renderer Pattern

**Pros:** Dễ mở rộng
**Cons:** Over-engineering cho scope hiện tại

### C: Adapt Admin Preview

**Pros:** DRY
**Cons:** Trộn admin/storefront concerns

## Final Solution

### Architecture

```
Homepage (Server Component)
    │
    ├─ Fetch: GET /api/v1/widgets (filter banner-slider)
    │
    └─ Render: <BannerSlider slides={...} />
                    ├─ Auto-rotate (5s)
                    ├─ Dot navigation
                    ├─ Arrow navigation
                    ├─ Swipe gestures
                    └─ Pause on hover
```

### Files

| File | Action |
|------|--------|
| `frontend/lib/api-server.ts` | Create |
| `frontend/components/storefront/banner-slider.tsx` | Create |
| `frontend/app/[locale]/(main)/page.tsx` | Modify |

### Component Features

- useEffect for auto-rotate với cleanup
- useState for activeIndex
- Touch events for swipe (no external lib)
- CSS transition for slide change
- Link wrapper if cta_link exists
- Responsive text positioning (reuse from preview)

### Data Flow

1. Build/Request: `page.tsx` fetches widgets server-side
2. Filter: First active `banner-slider` widget
3. Render: Pass `metadata.slides` to component
4. Hydration: Client enables auto-rotate

### Edge Cases

| Case | Handling |
|------|----------|
| No widget | Skip section |
| Empty slides | Don't render |
| Single slide | Hide nav, no auto-rotate |
| Image error | Fallback gradient |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| API filter by type | Filter client-side if needed |
| Swipe vs scroll conflict | Threshold detection |

## Success Criteria

- [ ] Banner widget từ admin hiển thị trên homepage
- [ ] Auto-rotate hoạt động đúng 5s
- [ ] Swipe gestures work on mobile
- [ ] Pause on hover
- [ ] No layout shift (CLS)
- [ ] Server-rendered cho SEO

## Next Steps

→ Create implementation plan via `/ck:plan`
