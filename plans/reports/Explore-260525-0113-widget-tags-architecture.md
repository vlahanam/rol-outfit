# Widget & Tag Architecture Scout Report

**Date:** 2025-05-25  
**Scope:** Widget edit page structure, homepage new arrivals section, widget data model, tag associations  
**Status:** Complete

---

## Executive Summary

The ROL Outfit application uses a **hierarchical widget system** to manage homepage sections with flexible JSON-based configuration. Currently, widgets are **tag-agnostic** — there is no association between widgets and tags. Tags exist independently and are only linked to products via the `product_tags` junction table. The "Hàng Mới Về" (New Arrivals) section is currently hardcoded in the homepage with placeholder products.

**Key Finding:** To implement tag-driven widget sections (e.g., displaying products by tag in a widget), the system requires:
1. Adding a `widget_tags` junction table
2. Extending the Widget model with tag-relationship capabilities
3. Updating widget editors and backend APIs to support tag selection
4. Modifying homepage rendering to fetch products by widget tags

---

## 1. Widget Data Model & Structure

### Backend Model: `/backend/src/internal/models/widget.go`

```go
type Widget struct {
    ID           string          // UUID primary key
    ParentID     *string         // Nullable, supports hierarchy
    Name         string          // Display name
    Type         WidgetType      // "banner-slider", "collection-grid", "new-product", "trend-hot"
    DisplayOrder int             // Sort order within parent
    Depth        int             // Hierarchy level (0 = root)
    Status       int8            // 1=HIDDEN, 2=ACTIVE
    Settings     json.RawMessage // JSONB: layout config (e.g., autoPlayInterval, cardHeight)
    Metadata     json.RawMessage // JSONB: content data (slides, items, etc.)
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

### Frontend Type Definition: `/frontend/types/api.ts`

```typescript
export type WidgetType = "banner-slider" | "collection-grid" | "new-product" | "trend-hot";

export interface Widget {
  id: string;
  parent_id: string | null;
  name: string;
  type: WidgetType;
  display_order: number;
  depth: number;
  status: number; // 1=HIDDEN, 2=ACTIVE
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
```

### Database Schema: `/backend/database/migrations/000009_create_widgets.up.sql`

```sql
CREATE TABLE widgets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id     UUID REFERENCES widgets(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    type          VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    depth         INTEGER DEFAULT 0,
    status        SMALLINT NOT NULL DEFAULT 1,
    settings      JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Metadata column added via:** `/backend/database/migrations/000015_add_metadata_to_widgets.up.sql`

---

## 2. Widget Types & Configuration

### Banner Slider
- **Purpose:** Homepage banner carousel
- **Settings:**
  - `autoPlayInterval` (number, ms): Default 5000ms
- **Metadata:**
  - `slides[]` array with: `id`, `image`, `label`, `title`, `description`, `cta_text`, `cta_link`, `text_x`, `text_y`, `font_scale`

### Collection Grid
- **Purpose:** Special collections/curated product groups
- **Settings:**
  - `cardHeight` (number, px): Default 400px
- **Metadata:**
  - `items[]` array with: `id`, `title`, `image`, `link`, `cta_text`

### New Product (Currently Unused in Frontend)
- **Purpose:** Display newly added products
- **Status:** Type is defined in enum but not actively rendered
- **Current Implementation:** Homepage shows hardcoded new arrivals, not via widget

### Trend Hot
- **Purpose:** Trending/hot products section
- **Settings:**
  - `cardHeight` (number, px): Default 400px
  - `showBadge` (boolean): Display "HOT" badge
- **Metadata:**
  - `items[]` array (same structure as Collection Grid)

---

## 3. Widget Edit Page Structure

### File Path: `/frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`

#### Form Fields:
1. **Widget Name** (text input, required, 2-255 chars)
2. **Type** (read-only display, set at creation)
3. **Status** (select: Hiển thị=2, Ẩn=1)

#### Type-Specific Editors:

**Banner Slider:**
- Auto-play settings slider (2-15 seconds)
- Slide editor with image upload, label, title, description, CTA text/link, text positioning
- Preview panel

**Collection Grid:**
- Card height slider (200-600px)
- Item editor with image, title, link, CTA text
- Preview panel

**Trend Hot:**
- Card height slider (200-600px)
- Badge visibility toggle
- Item editor (same as collection-grid)
- Full-page preview modal

#### Editor Component Pattern:
```typescript
interface EditorProps {
  items: CollectionItem[];
  onChange: (items: CollectionItem[]) => void;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

// defaultCollectionItem()
{
  id: crypto.randomUUID(),
  title: "",
  image: "",
  link: "",
  cta_text: "Mua Ngay" // or "Khám Phá" for trend-hot
}
```

#### Data Submission:
- Validates all required fields (e.g., every slide must have an image)
- Constructs `UpdateWidgetPayload`
- Calls `api.adminWidgets.update(id, payload)`
- Updates both `metadata` and `settings` as JSON blobs

---

## 4. Homepage New Arrivals Section

### File Path: `/frontend/app/[locale]/(main)/page.tsx`

#### Current Implementation:
**Hardcoded products**, not widget-driven:
```typescript
<section className="mb-12">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-3xl font-bold text-gray-900">{t("newArrivals")}</h2>
    {/* Navigation buttons */}
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
    <ProductItem name={t("cottonLogo")} price="720.000₫" image="..." rating={4.5} isNew />
    {/* ... 9 more hardcoded items ... */}
  </div>
</section>
```

#### Widget Fetching (Already Implemented):
```typescript
// Fetches active widgets by type
const widgets = await fetchWidgets("banner-slider");
const collectionWidgets = await fetchWidgets("collection-grid");
const trendHotWidgets = await fetchWidgets("trend-hot");
```

#### New Arrivals Widget Rendering (NOT YET IMPLEMENTED):
```typescript
// Future implementation would be:
const newProductWidgets = await fetchWidgets("new-product");
// Then render using widget metadata/items
```

---

## 5. Tag Data Model

### Backend Model: `/backend/src/internal/models/tag.go`

```go
type Tag struct {
    ID        string     // UUID
    Name      string     // Tag name
    Slug      string     // URL-safe slug (unique)
    StartAt   *time.Time // Campaign start date (nullable)
    EndAt     *time.Time // Campaign end date (nullable)
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

### Frontend Type: `/frontend/types/api.ts`

```typescript
export interface Tag {
  id: string;
  name: string;
  slug: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Database Schema:
```sql
CREATE TABLE tags (
    id        UUID PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    slug      VARCHAR(255) NOT NULL UNIQUE,
    start_at  TIMESTAMP WITH TIME ZONE,
    end_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Product-Tag Association

### Junction Table: `/backend/src/internal/models/product_tag.go`

```go
type ProductTag struct {
    ProductID string    // UUID FK -> products.id
    TagID     string    // UUID FK -> tags.id
    CreatedAt time.Time
}
```

### Database Table:
```sql
CREATE TABLE product_tags (
    product_id UUID NOT NULL REFERENCES products(id),
    tag_id     UUID NOT NULL REFERENCES tags(id),
    created_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (product_id, tag_id)
);
```

### API Methods: `/frontend/lib/api-resources.ts`

```typescript
adminProducts.assignTags(productId: string, tagIds: string[]): Promise<void>
// PUT /products/{id}/tags with { tag_ids: [...] }
```

### Frontend Integration:
- Products loaded via `adminProducts.list()` include `tags[]` array
- `AdminProduct` type extends `Product` with full tag objects
- Tags can be assigned/reassigned to products in admin panel

---

## 7. API Endpoints

### Widget Management:

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/widgets?limit=50` | Fetch active widgets (front-end, cached) | None |
| GET | `/api/v1/admin/widgets` | List widgets (admin) | Admin |
| GET | `/api/v1/admin/widgets/:id` | Get widget detail (admin) | Admin |
| POST | `/api/v1/widgets` | Create widget | Admin |
| PUT | `/api/v1/widgets/:id` | Update widget | Admin |
| DELETE | `/api/v1/widgets/:id` | Delete widget | Admin |

### Tag Management:

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/admin/tags?limit=100` | List all tags (admin) | Admin |
| POST | `/api/v1/tags` | Create tag | Admin |
| PUT | `/api/v1/tags/:id` | Update tag | Admin |
| DELETE | `/api/v1/tags/:id` | Delete tag | Admin |

### Product-Tag Association:

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| PUT | `/api/v1/products/:id/tags` | Assign tags to product | Admin |

---

## 8. Widget Lifecycle

### Creation Flow:
1. Admin navigates to `/admin/widgets`
2. Clicks "Create Widget" (creates empty widget with one item)
3. Fills in Name and selects Type
4. Configures type-specific settings (sliders, content)
5. Submits to `POST /api/v1/widgets`
6. Widget service creates record with settings/metadata JSON

### Editing Flow:
1. Admin navigates to `/admin/widgets/:id/edit`
2. Loads widget via `GET /api/v1/admin/widgets/:id`
3. Frontend deserializes metadata/settings JSON
4. Editor fills in form with existing data (merges with defaults)
5. User modifies content/settings
6. Submits to `PUT /api/v1/widgets/:id`
7. Widget service updates metadata/settings fields

### Frontend Rendering:
1. Server-side: `fetchWidgets(type)` calls `GET /api/v1/widgets?type=...`
2. Filters widgets by status=ACTIVE and parent_id=NULL
3. Extracts metadata and settings
4. Passes to component renderers (BannerSlider, CollectionSlider, etc.)
5. Components render items/slides from metadata

---

## 9. Current Limitations & Missing Features

### 1. **No Widget-Tag Relationship**
- ❌ Widgets cannot be filtered by or linked to tags
- ❌ No junction table `widget_tags` exists
- ❌ Cannot display "products tagged with X" in a widget

### 2. **New Arrivals Not Widget-Driven**
- ❌ Homepage hardcodes 10 products instead of using "new-product" widget
- ❌ No way to dynamically manage new arrivals from admin panel
- ❌ No date-based product filtering by creation date

### 3. **Missing Server-Side Product Filtering**
- ❌ No endpoint to fetch products by tag
- ❌ No product querying by creation date ("new" products)
- ❌ Widget editors can't select from dynamic product lists

### 4. **Widget Content is Static**
- All widget content is stored as static JSON in metadata
- Cannot reference live products or dynamic collections
- Updates require manual re-editing of widget metadata

### 5. **Tag Campaign Dates**
- Tags have `start_at`/`end_at` fields but not actively used
- No automatic tag visibility based on dates
- No temporal filtering in product queries

---

## 10. File Structure Summary

### Backend:
```
backend/src/internal/
├── models/
│   ├── widget.go           # Widget struct (no tag fields)
│   ├── tag.go              # Tag struct
│   └── product_tag.go       # Product-Tag junction
├── repositories/
│   └── widget_repo.go       # Widget CRUD operations
├── services/
│   └── widget_service.go    # Widget business logic
├── controllers/
│   └── widget_controller.go # Widget HTTP handlers
├── dto/
│   └── widget_dto.go        # Widget DTO for responses
└── requests/
    └── widget_request.go    # Widget request validation
```

### Frontend:
```
frontend/
├── app/admin/(protected)/widgets/
│   ├── page.tsx              # Widget list with drag-reorder
│   └── [id]/edit/page.tsx    # Widget editor page
├── components/admin/widgets/
│   ├── banner-slider-editor.tsx
│   ├── collection-grid-editor.tsx
│   ├── trend-hot-editor.tsx
│   ├── *-preview.tsx          # Preview components
│   └── widget-row.tsx         # Table row component
├── app/[locale]/(main)/page.tsx # Homepage with hardcoded new arrivals
├── lib/
│   ├── api.ts               # API exports and labels
│   ├── api-resources.ts     # API methods (adminWidgets, adminTags)
│   └── api-server.ts        # Server-side fetch (fetchWidgets)
└── types/api.ts             # TypeScript interfaces
```

### Database:
```
backend/database/migrations/
├── 000009_create_widgets.up.sql        # Widget table
├── 000015_add_metadata_to_widgets.up.sql
├── 000018_update_widget_type_enum.up.sql
├── 000011_create_tags.up.sql
└── 000012_create_product_tags.up.sql   # Product-Tag junction
```

---

## 11. Key Code Paths

### Widget Fetching (Frontend):
- **Server-side:** `lib/api-server.ts` → `fetchWidgets(type)`
- **Request:** `GET /api/v1/widgets?limit=50` (filters by type and status=ACTIVE)
- **Response:** Array of Widget objects with metadata/settings

### Widget Editing:
- **Load:** `api.adminWidgets.get(id)` → `GET /admin/widgets/:id`
- **Save:** `api.adminWidgets.update(id, payload)` → `PUT /admin/widgets/:id`
- **Validation:** Frontend validates required fields before submit

### Homepage Rendering:
- **Widgets fetch:** `await fetchWidgets("banner-slider")`, `await fetchWidgets("collection-grid")`
- **Metadata extraction:** `(widget.metadata as BannerSliderMetadata)?.slides`
- **Component rendering:** `<BannerSlider slides={slides} />`, `<CollectionSlider items={items} />`

---

## 12. Unresolved Questions

1. **Product Selection in Widgets**
   - How should widgets reference live products? Static JSON or dynamic queries?
   - Should widget editors have a product picker, or is metadata-only sufficient?

2. **Tag-Widget Integration**
   - Should widgets be filterable by tag in admin list?
   - Should a widget display all products with specific tags, or just store selected products?

3. **New Arrivals Definition**
   - Is "new" based on product creation date or explicit tagging?
   - Should new arrivals widget auto-populate or require manual curation?

4. **Widget Hierarchy**
   - Parent/child widget relationships exist in schema but aren't used in UI
   - Is hierarchical widget grouping needed, or should we flatten the structure?

5. **Widget Status vs. Visibility**
   - Why is widget visibility a separate concern from display_order?
   - Should hidden widgets be excluded from admin list, or just marked visually?

---

## 13. Recommendations for Implementation

### Phase 1: Widget-Tag Association
1. Create `widget_tags` junction table (migration)
2. Add `tags?: Tag[]` to Widget frontend type
3. Update widget editor to include tag selection dropdown/multi-select
4. Update widget API request/response DTOs

### Phase 2: Dynamic New Arrivals
1. Add product query endpoint: `GET /api/v1/products?tag=slug&sort=created_at`
2. Convert new-product widget type to reference tags instead of static items
3. Update homepage to use new-product widget instead of hardcoded products

### Phase 3: Product Selection in Widgets
1. Add admin endpoint for product search/selection
2. Update collection-grid editor to allow dynamic product selection
3. Implement server-side product filtering by widget configuration

---

**Report Generated:** 2025-05-25 UTC  
**Exploration Depth:** Very Thorough (12+ file reads, full schema analysis)
