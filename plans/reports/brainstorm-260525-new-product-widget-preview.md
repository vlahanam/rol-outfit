# Brainstorm: New Product Widget Preview

**Date:** 2026-05-25  
**Status:** Approved  
**Scope:** Widget edit page preview for "Hàng Mới Về" section

---

## Problem Statement

Widget type `new-product` exists in enum but has no editor/preview UI. The homepage "Hàng Mới Về" section is hardcoded with 10 placeholder products. Admin needs to:
1. Configure which products appear via tag selection
2. Preview how products will display before publishing
3. Control grid layout and quantity

---

## Requirements (Confirmed)

| Requirement | Decision |
|-------------|----------|
| Data source | Fetch real products by selected tags |
| Settings | Tags (multi-select) + quantity + grid columns |
| Preview type | Inline only (no full-page modal) |
| Tag logic | OR - product matches ANY selected tag |
| Section title | Use widget.name as title |
| Backend | Extend API to support `tags=slug1,slug2,slug3` |

---

## Current State Analysis

### Backend
- `GET /api/v1/products?tag=<slug>` - supports **single tag** only
- `ListProducts(ctx, categoryID, tagSlug, offset, limit)` in `product_repo.go`
- Tags have campaign dates (`start_at`, `end_at`) for temporal filtering

### Frontend
- No `new-product-editor.tsx` or `new-product-preview.tsx`
- Widget edit page (line 305-361) only handles: `banner-slider`, `collection-grid`, `trend-hot`
- Preview page (`/preview`) only supports `trend-hot`
- `ProductItem` component exists for rendering products

### Database
- No `widget_tags` junction table
- Tags stored in widget `metadata` JSON (simpler approach)

---

## Recommended Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Widget Edit Page (/admin/widgets/:id/edit)                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│ │ Settings Panel  │  │ Inline Preview                       │  │
│ │                 │  │ ┌──────┐┌──────┐┌──────┐┌──────┐    │  │
│ │ [Tags Multi]    │  │ │      ││      ││      ││      │    │  │
│ │ [Quantity: 10]  │  │ │ Prod ││ Prod ││ Prod ││ Prod │    │  │
│ │ [Columns: 5]    │  │ │      ││      ││      ││      │    │  │
│ │                 │  │ └──────┘└──────┘└──────┘└──────┘    │  │
│ └─────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User selects tags in editor
2. Frontend calls: GET /api/v1/products?tags=slug1,slug2&limit=N
3. Backend returns products matching ANY tag (OR logic)
4. Preview renders ProductItem grid with fetched data
5. On save: widget.metadata = { tag_ids: [...], quantity: N, columns: N }
```

---

## Implementation Plan

### Phase 1: Backend API Extension
**Files to modify:**
- `backend/src/internal/repositories/product_repo.go`
- `backend/src/internal/controllers/product_controller.go`

**Changes:**
1. Modify `ListProducts` to accept `tagSlugs []string`
2. Change query: `WHERE tags.slug IN (?, ?, ?)` for OR logic
3. Update controller to parse comma-separated `tags` parameter

### Phase 2: Frontend Widget Editor
**Files to create:**
- `frontend/components/admin/widgets/new-product-editor.tsx`
- `frontend/components/admin/widgets/new-product-preview.tsx`

**Files to modify:**
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`
- `frontend/lib/api-resources.ts` (add products fetch method)
- `frontend/types/api.ts` (add NewProductMetadata, NewProductSettings)

**Editor features:**
- Multi-select tag dropdown (fetch from `adminTags.listAll()`)
- Quantity slider (5-20 products)
- Grid columns select (2-5 columns)

**Preview features:**
- Responsive grid using selected columns
- Fetch real products by selected tags
- Device toggle (desktop/mobile)
- Loading state while fetching

### Phase 3: Homepage Integration (Optional)
**Files to modify:**
- `frontend/app/[locale]/(main)/page.tsx`
- `frontend/lib/api-server.ts`

**Changes:**
- Replace hardcoded products with widget-driven fetch
- Use `fetchWidgets("new-product")` → get tags → fetch products

---

## Widget Data Model

### Metadata (content)
```typescript
interface NewProductMetadata {
  tag_ids: string[];  // Selected tag UUIDs
}
```

### Settings (config)
```typescript
interface NewProductSettings {
  quantity: number;   // 5-20, default 10
  columns: number;    // 2-5, default 5
}
```

---

## API Changes

### Before
```
GET /api/v1/products?tag=single-slug&limit=10
```

### After
```
GET /api/v1/products?tags=slug1,slug2,slug3&limit=10
```

**Backend query (OR logic):**
```sql
SELECT DISTINCT products.*
FROM products
JOIN product_tags ON product_tags.product_id = products.id
JOIN tags ON tags.id = product_tags.tag_id
WHERE tags.slug IN ('slug1', 'slug2', 'slug3')
  AND products.status = 2
  AND products.deleted_at IS NULL
  AND (tags.start_at IS NULL OR tags.start_at <= NOW())
  AND (tags.end_at IS NULL OR tags.end_at >= NOW())
ORDER BY products.created_at DESC
LIMIT 10
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| No products match tags | Show "Không có sản phẩm" message in preview |
| API performance with many tags | Limit to 10 tags max, use DISTINCT |
| Tag IDs stored but tags deleted | Frontend handles missing tags gracefully |

---

## Success Criteria

- [ ] Widget edit page shows new-product editor when type = "new-product"
- [ ] Tag multi-select fetches and displays available tags
- [ ] Preview fetches real products by selected tags
- [ ] Preview respects quantity and columns settings
- [ ] Preview shows responsive grid (desktop/mobile toggle)
- [ ] Save persists tag_ids, quantity, columns to widget
- [ ] Homepage uses widget data instead of hardcoded products (Phase 3)

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Backend | 1-2 hours |
| Phase 2: Frontend | 3-4 hours |
| Phase 3: Homepage | 1-2 hours |
| **Total** | **5-8 hours** |

---

**Report Generated:** 2026-05-25 UTC
