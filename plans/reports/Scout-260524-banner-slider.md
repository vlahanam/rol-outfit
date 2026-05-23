# Scout Report: Banner Slider Widget Implementation

## Current State Summary

The banner slider widget has a complete **admin editor** but **NO storefront rendering**. Widgets are stored in the database but not displayed on the homepage.

---

## 1. Admin Banner Slider Editor

**Files:**
- `/frontend/components/admin/widgets/banner-slider-editor.tsx` - Full-featured slide editor
- `/frontend/components/admin/widgets/banner-slider-preview.tsx` - Live preview
- `/frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` - Edit page

**Capabilities:**
- Add/remove slides (minimum 1 required)
- Edit per-slide: image, label, title, description, CTA text/link
- Position controls: text_x (0-80%), text_y (20-100%), font_scale (0.5-2x)
- Real-time preview with gradient overlay, dot indicators
- Drag-and-drop reordering of widgets

---

## 2. Widget Data Flow

**Types** (`/frontend/types/api.ts`):
- `BannerSlide`: id, image, label, title, description, cta_text, cta_link, text_x, text_y, font_scale
- `BannerSliderMetadata`: { slides: BannerSlide[] }
- `Widget`: Generic widget with metadata field storing type-specific data
- `WidgetType`: "banner-slider" | "list-image" | "new-product" | "trend-hot"

**API Endpoints** (`/frontend/lib/api-resources.ts`):
- `GET /admin/widgets?page=X&limit=Y&parent_id=Z` - List widgets
- `GET /admin/widgets/{id}` - Get widget details (includes metadata)
- `POST /widgets` - Create widget
- `PUT /widgets/{id}` - Update widget (stores metadata)
- `DELETE /widgets/{id}` - Delete widget

**Flow:**
1. Admin edits widget → slides array stored in `widget.metadata.slides`
2. Status field: 1=HIDDEN, 2=ACTIVE
3. Display order & depth tracked for layout control

---

## 3. Homepage Implementation

**File:** `/frontend/app/[locale]/(main)/page.tsx`

Currently hardcoded sections with static content:
- Special Collections (grid)
- New Arrivals (product grid)
- Hot Trends (trending cards)
- **NO widget rendering whatsoever**

---

## 4. Missing Pieces for Homepage Integration

1. **Widget Fetching Hook/Utility**
   - No `getWidgets()` or widget fetch logic exists
   - Need to fetch active widgets (status=2) ordered by display_order

2. **Widget Renderer Component**
   - No generic `WidgetRenderer` or `RenderWidget` component
   - Need to switch on `widget.type` and render appropriate component
   - Only banner-slider has a storefront component (BannerSliderPreview)

3. **Storefront Banner Slider Component**
   - BannerSliderPreview exists (admin only)
   - Need interactive version for homepage: auto-rotate slides, click navigation, responsive

4. **Server Action / Data Fetching**
   - Homepage is async server component but doesn't fetch widgets
   - Need backend endpoint to fetch active widgets for storefront (public API)

5. **Type Guards & Rendering Logic**
   - No switch-case for rendering "list-image", "new-product", "trend-hot" types
   - These widget types defined but no components exist

---

## 5. Next Steps

- [ ] Create public API endpoint: `GET /widgets?status=2&order_by=display_order`
- [ ] Build generic `WidgetRenderer` component
- [ ] Create interactive `StorefrontBannerSlider` component
- [ ] Replace hardcoded sections with dynamic widget rendering on homepage
- [ ] Create stub components for other widget types
