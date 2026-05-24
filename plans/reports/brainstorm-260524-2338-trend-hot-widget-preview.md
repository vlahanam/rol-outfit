# Brainstorm: Trend Hot Widget Preview

**Date:** 2026-05-24  
**Widget:** Xu hướng hot (trend-hot)  
**URL:** http://localhost/admin/widgets/{id}/edit

---

## Problem Statement

Widget "Xu hướng hot" tại trang edit admin cần tính năng preview giống với hiển thị trên homepage. Hiện tại widget type `trend-hot` đã được định nghĩa nhưng chưa có editor và preview component.

## Requirements

### Functional
- Preview widget theo style CollectionSlider (horizontal scroll)
- Device toggle: Desktop / Mobile view
- Real-time update khi chỉnh sửa item
- Active item highlight (badge "Đang sửa")
- Full-page preview modal (iframe giống homepage)

### Non-functional
- Reuse `CollectionItem` type (DRY principle)
- Không cần thay đổi backend
- Code mới < 400 lines

---

## Evaluated Approaches

### Approach A: Reuse CollectionItem ✅ SELECTED
- Dùng lại `CollectionItem` type
- Tạo `TrendHotPreview` riêng với style phù hợp
- ~400 lines code mới

### Approach B: New TrendHotItem Type
- Tạo type riêng với fields tùy chỉnh
- ~500 lines code mới
- Flexibility cao hơn nhưng YAGNI

---

## Final Design

### Data Model

```typescript
// Reuse existing CollectionItem
interface CollectionItem {
  id: string;
  title: string;
  image: string;
  link: string;
  cta_text: string;
}

// NEW: TrendHotMetadata (alias)
type TrendHotMetadata = CollectionGridMetadata; // { items: CollectionItem[] }

// NEW: TrendHotSettings
interface TrendHotSettings {
  cardHeight?: number;  // default 400px
  showBadge?: boolean;  // show "HOT" badge
}
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Edit Widget Page                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Settings Section                        │   │
│  │  - Card height slider                                │   │
│  │  - Show badge toggle                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TrendHotPreview                         │   │
│  │  ┌─────────────┐  ┌────────────────────────┐        │   │
│  │  │ Device      │  │ [Desktop] [Mobile]      │        │   │
│  │  │ Toggle      │  │ [Full Preview] button   │        │   │
│  │  └─────────────┘  └────────────────────────┘        │   │
│  │                                                      │   │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ◄── Horizontal scroll  │   │
│  │  │Item│ │Item│ │Item│ │Item│     Active = blue ring │   │
│  │  │ 1  │ │ 2* │ │ 3  │ │ 4  │                        │   │
│  │  └────┘ └────┘ └────┘ └────┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TrendHotEditor                          │   │
│  │  - Item list with drag-reorder                       │   │
│  │  - Image upload                                      │   │
│  │  - Title, link, CTA text inputs                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Full-Page Preview (postMessage Flow)

```
┌────────────────────┐         ┌─────────────────────────┐
│    Edit Page       │         │    Preview Page         │
│    (Parent)        │         │    (Iframe)             │
├────────────────────┤         ├─────────────────────────┤
│                    │         │                         │
│  Click "Preview"   │         │  /preview?widget=       │
│         │          │         │    trend-hot            │
│         ▼          │         │         │               │
│  Open Modal +      │ ──────► │  iframe loads           │
│  iframe            │         │         │               │
│         │          │         │         ▼               │
│         │          │ ◄────── │  postMessage('ready')   │
│         │          │         │                         │
│         ▼          │         │                         │
│  postMessage({     │ ──────► │  Receive data           │
│    type, items,    │         │         │               │
│    settings        │         │         ▼               │
│  })                │         │  Render CollectionSlider│
│                    │         │  with received data     │
└────────────────────┘         └─────────────────────────┘
```

### Files to Create/Modify

| File | Action | Lines |
|------|--------|-------|
| `components/admin/widgets/trend-hot-preview.tsx` | CREATE | ~150 |
| `components/admin/widgets/trend-hot-editor.tsx` | CREATE | ~120 |
| `components/admin/widgets/full-page-preview-modal.tsx` | CREATE | ~80 |
| `app/preview/page.tsx` | CREATE | ~60 |
| `types/api.ts` | MODIFY | +10 |
| `app/admin/(protected)/widgets/[id]/edit/page.tsx` | MODIFY | +50 |

**Total:** ~470 lines

### Component Details

#### 1. TrendHotPreview
- Props: `items`, `activeIndex`, `onActiveChange`, `cardHeight`, `showBadge`
- Features:
  - Device toggle (Desktop/Mobile)
  - Scroll controls (left/right arrows)
  - Click item to select
  - Active item has blue ring + "Đang sửa" badge
  - "Full Preview" button opens modal

#### 2. TrendHotEditor
- Props: `items`, `onChange`, `activeIndex`, `onActiveChange`
- Features:
  - Vertical list of items
  - Drag-to-reorder (dnd-kit)
  - Image upload with preview
  - Title, link, CTA text inputs
  - Add/remove item buttons

#### 3. FullPagePreviewModal
- Props: `isOpen`, `onClose`, `widgetType`, `data`
- Features:
  - Full-screen modal with X button
  - Iframe pointing to `/preview?widget={type}`
  - postMessage communication
  - Loading state

#### 4. Preview Page (`/preview`)
- Server component wrapper
- Client component listens for postMessage
- Renders appropriate widget (CollectionSlider for trend-hot)
- No header/footer, just widget

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| postMessage timing issues | Medium | Low | Add retry logic, loading state |
| Mobile responsiveness | Low | Medium | Test on multiple viewports |
| Image upload failures | Low | Medium | Use existing upload component |

## Security Considerations

- postMessage origin check required
- Iframe sandbox attributes: `allow-scripts allow-same-origin`
- No sensitive data in preview

## Success Criteria

- [ ] Preview updates real-time when editing
- [ ] Device toggle changes aspect ratio correctly
- [ ] Full-page modal renders identical to homepage
- [ ] Active item highlighted in preview
- [ ] All existing widget features still work

## Next Steps

1. Create `TrendHotSettings` type in `types/api.ts`
2. Create `TrendHotPreview` component
3. Create `TrendHotEditor` component
4. Create `FullPagePreviewModal` component
5. Create `/preview` page route
6. Integrate into edit page
7. Test all features

---

## Questions

None - all requirements clarified.
