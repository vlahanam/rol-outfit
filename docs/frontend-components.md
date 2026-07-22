# Frontend Components & Advanced Patterns

Advanced component patterns and utilities used in the rol-outfit frontend.

## Rich Text Editor (Tiptap)

**Component:** `components/admin/tiptap-editor.tsx`

**Purpose:** Rich text editor for product descriptions and dynamic content.

**Stack:**
- **Tiptap** — Headless editor framework
- **@tiptap/react** — React integration
- **@tiptap/starter-kit** — Core extensions (Paragraph, Heading, Bold, Italic, etc.)
- **@tiptap/extension-underline** — Underline support
- **tailwindcss** — Toolbar styling

**Key Features:**
- Toolbar with formatting buttons (Bold, Italic, Underline, Heading levels)
- Support for lists (bullet/ordered), blockquotes, code blocks
- Keyboard shortcuts for common formatting (Ctrl+B for bold, etc.)
- Configurable placeholder text
- JSON output for database storage
- HTML rendering for display

**Usage Pattern:**

```typescript
import TiptapEditor from "@/components/admin/tiptap-editor";

interface ProductFormProps {
  initialContent?: string;
  onContentChange: (html: string, json: object) => void;
}

export default function ProductForm({ initialContent, onContentChange }: ProductFormProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Description</label>
      <TiptapEditor
        initialContent={initialContent}
        onChange={({ html, json }) => onContentChange(html, json)}
        placeholder="Enter product description..."
      />
    </div>
  );
}
```

**Integration with Forms:**
- Editor onChange handler updates parent component state
- Content serialized as HTML string for database storage
- On edit, pass `initialContent` prop to restore previous text
- Both HTML and JSON formats available for different use cases

---

## Variant Picker Component

**Component:** `components/product/variant-picker.tsx`

**Purpose:** Interactive variant selector for product detail pages with availability awareness.

**Features:**
- Attribute-based filtering (e.g., Color → Size → specific variant)
- Shows availability and stock status for each combination
- Disables unavailable combinations automatically
- Displays variant-specific price (accounts for discounts)
- Price updates dynamically on variant selection

**Data Flow:**
1. Parent passes product with all variants to component
2. User selects attribute values (e.g., Color="Red", Size="M")
3. Component finds matching variant by attribute combination
4. Shows selected variant's price, stock, discount info
5. Calls `onVariantSelect()` callback with selected variant

**Example Usage:**

```typescript
import VariantPicker from "@/components/product/variant-picker";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  return (
    <div className="space-y-6">
      <h1>{product.name}</h1>
      <VariantPicker
        product={product}
        onVariantSelect={setSelectedVariant}
      />
      {selectedVariant && (
        <div>
          <p className="text-2xl font-bold">${selectedVariant.salePrice}</p>
          <button>Add to Cart</button>
        </div>
      )}
    </div>
  );
}
```

**Stock Awareness:**
- Component checks variant stock before enabling selection
- Greyed-out unavailable combinations with "Out of Stock" label
- Prevents adding to cart for unavailable variants

---

## Image Gallery Component

**Component:** `components/product/image-gallery.tsx`

**Purpose:** Multi-image carousel for product display (product + variant images).

**Features:**
- Primary product image with thumbnail sidebar
- Variant image swapping on variant selection
- Smooth transitions between images
- Mobile-responsive layout (vertical on mobile, horizontal on desktop)

**API Integration:**
- Product has `Image` (primary) and `Avatar` (fallback)
- Variants have `Avatar` field for variant-specific images
- Fallback chain: variant avatar → product avatar → product image

**Usage:**

```typescript
import ImageGallery from "@/components/product/image-gallery";

export default function ProductDetail({ product, selectedVariant }: Props) {
  const images = selectedVariant?.avatar
    ? [selectedVariant.avatar, product.avatar, product.image]
    : [product.avatar, product.image];

  return <ImageGallery images={images.filter(Boolean)} />;
}
```

---

## Tag Badges Component

**Component:** `components/product/tag-badges.tsx`

**Purpose:** Display product tags as styled badges (admin and public views).

**Features:**
- Compact badge design with color coding
- Active-window filtering for public view
- Hover tooltips with tag metadata
- Admin view shows all tags (including inactive)

**Public vs Admin Filtering:**
- Backend returns only active tags (filtered by start_at/end_at)
- Frontend displays public tags without additional filtering
- Admin pages make separate API calls to show all tags

---

## Image Uploader Component

**Component:** `components/admin/image-uploader.tsx` (324 LOC)

**Purpose:** Reusable file upload component with upload-then-reference flow.

**Upload Flow:**
1. User selects file via file input
2. Component validates size and type client-side
3. Calls `POST /api/v1/uploads` with FormData
4. Shows spinner overlay during upload
5. Returns file URL to parent form
6. Attempts best-effort deletion of previous file

**Key Features:**
- MIME type validation (JPEG, PNG, WebP, GIF)
- File size validation (configurable, default 10 MB)
- Spinner overlay during upload
- Error message display
- Best-effort old file deletion on replace
- Returns file URL directly to parent component

**Props:**

```typescript
interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageSelect: (url: string) => void;
  maxSize?: number; // bytes, default 10485760 (10 MB)
  accept?: string;
}
```

**Usage:**

```typescript
<ImageUploader
  currentImageUrl={product.avatar}
  onImageSelect={(url) => setFormData({ ...formData, avatar: url })}
  maxSize={10485760}
/>
```

---

## Product Info Panel Component

**Component:** `components/admin/product-info-panel.tsx` (324 LOC)

**Purpose:** Flexible product info editor for admin product edit page.

**Three Modes:**
- **View mode** — Display product info (read-only)
- **Edit mode** — Form with input fields
- **Form mode** — Embedded form for add/edit workflows

**Key Features:**
- Inline avatar editing with ImageUploader
- Attribute name management (add/remove dynamic fields)
- Price and discount inputs with datetime pickers
- Category selection dropdown
- Status toggle
- Cancel/Save with revert-on-error

**Mode Transitions:**
- View → Edit on Edit button click
- Edit → View on Save (API success)
- Edit → View on Cancel (revert state)

---

## Multi-Tab Auth Synchronization

**Mechanism:** BroadcastChannel API via `lib/auth.ts`

**Purpose:** Synchronize logout and token refresh across browser tabs.

**Flow:**
1. User logs out in Tab A
2. localStorage is cleared in Tab A
3. BroadcastChannel message sent to all tabs
4. Tab B/C receive "logout" message
5. Tab B/C clear their auth state and redirect to login

**Implementation:**

```typescript
const authChannel = new BroadcastChannel('auth');

export function logout() {
  // Clear localStorage
  localStorage.removeItem('auth_token');
  // Notify all tabs
  authChannel.postMessage({ type: 'logout' });
  // Redirect
  router.push('/login');
}

// In app initialization:
authChannel.onmessage = (event) => {
  if (event.data.type === 'logout') {
    // React to logout from another tab
    setAuthUser(null);
    router.push('/login');
  }
};
```

---

## API Client Auto-Retry Pattern

**Location:** `lib/api-client.ts` (146 LOC)

**Purpose:** Automatic 401 retry with promise deduplication to prevent token-refresh stampede.

**Problem Solved:**
- Multiple simultaneous API requests fail with 401
- Without deduplication, all spawn independent token refresh calls
- Token refresh success, but multiple refreshes confuse server/client

**Solution:**
- First 401 request triggers token refresh
- Subsequent 401 requests wait for same refresh promise
- All retry with new token after refresh completes

**Implementation:**

```typescript
let refreshPromise: Promise<string> | null = null;

async function fetchWithAuth(url: string, options?: RequestInit) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Only trigger refresh if not already in progress
    if (!refreshPromise) {
      refreshPromise = api.auth.refresh().then((newToken) => {
        localStorage.setItem('auth_token', newToken);
        refreshPromise = null;
        return newToken;
      });
    }
    
    const newToken = await refreshPromise;
    
    // Retry original request with new token
    return fetchWithAuth(url, options);
  }

  return response;
}
```

---

## Validation Schemas (Zod)

**Location:** `lib/validations.ts` (148 LOC)

**Pattern:** Centralized Zod schemas for all forms, reused in React Hook Form.

**Example:**

```typescript
export const productSchema = z.object({
  name: z.string().min(3, "Product name required (min 3 chars)"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  avatar: z.string().optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_start_at: z.date().optional(),
  discount_end_at: z.date().optional(),
  category_id: z.number().positive("Category required"),
});

type ProductFormData = z.infer<typeof productSchema>;
```

**Usage in Forms:**

```typescript
import { productSchema } from "@/lib/validations";

export function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
  });

  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

---

## Component Organization Best Practices

**Directory Structure:**

```
components/
├── admin/                      # Admin-only components
│   ├── product-info-panel.tsx  # Product info editor
│   ├── product-variants-table.tsx
│   ├── product-tags-panel.tsx
│   ├── image-uploader.tsx      # Reusable file upload
│   ├── tiptap-editor.tsx       # Rich text editor
│   └── ...
├── product/                    # Product-specific components
│   ├── variant-picker.tsx      # Variant selector
│   ├── image-gallery.tsx       # Product image carousel
│   ├── tag-badges.tsx          # Tag display
│   └── ...
├── common/                     # Shared across app
│   ├── header.tsx
│   ├── footer.tsx
│   ├── product-card.tsx
│   ├── delete-confirm-modal.tsx
│   └── ...
└── ...
```

**Component Responsibilities:**
- One component = one concern (SRP principle)
- Composition over inheritance
- Props-based configuration
- Callbacks for parent communication
- Server/Client boundaries clear (use 'use client' judiciously)

---

## Shared Slide Overlay Component

**Component:** `components/shared/slide-overlay.tsx` (65 LOC)

**Purpose:** Reusable text overlay for banner slides with position control, scaling, and optional link rendering.

**Features:**
- Absolute positioning with dynamic x/y coordinates (percentage-based)
- Font scaling via CSS transform-origin for responsive text sizing
- Gradient overlay-ready (parent handles gradient, component handles text)
- Optional CTA button with link support (linkEnabled prop)
- Smooth opacity transitions for slide changes
- Responsive padding (p-6 mobile, p-8 desktop)
- Yellow label, white title, gray description text colors

**Props:**

```typescript
interface SlideOverlayProps {
  slide: BannerSlide;
  isActive?: boolean;           // Controls visibility via opacity + pointer-events
  linkEnabled?: boolean;        // If true, CTA renders as <Link>, else as <span>
  className?: string;           // Additional Tailwind classes
}
```

**Data Structure (BannerSlide):**

```typescript
interface BannerSlide {
  id: string;
  image: string;
  label: string;               // Yellow upper-text
  title: string;               // Main white heading
  description: string;         // Gray sub-text
  cta_text: string;           // Button label
  cta_link: string;           // Button href
  text_x?: number;            // % from left (default 5)
  text_y?: number;            // % from top (default 80)
  font_scale?: number;        // Scale multiplier (default 1)
}
```

**Usage Examples:**

Admin Preview (read-only, no links):
```typescript
<SlideOverlay
  slide={slide}
  isActive={true}
  linkEnabled={false}
/>
```

Storefront Display (interactive, with links):
```typescript
<SlideOverlay
  slide={slide}
  isActive={i === activeIndex}
  linkEnabled={true}
/>
```

**Rendering Logic:**
- Optional fields: label, title, description, cta (all conditionally rendered)
- Position calculated from `text_x`, `text_y`, `font_scale` via inline style
- CTA wraps in `<Link>` (production) or `<span>` (preview) based on `linkEnabled` prop
- Opacity transitions handled by `isActive` boolean (0ms → 300ms on change)

**Design Pattern:**
- **Extraction:** Previously inline in `BannerSliderPreview` and `BannerSlider`; extracted for WYSIWYG consistency
- **Reusability:** Shared between admin preview and storefront display with same rendering, different link behavior
- **Bug Fix:** Centralizes text overlay logic, ensuring admin preview matches storefront exactly

**Key Differences from Parent Components:**
- `BannerSlider` (storefront): Full interactivity (autoplay, touch, nav buttons), `linkEnabled=true`
- `BannerSliderPreview` (admin): Static preview with dot indicators, `linkEnabled=false`
- Both use identical `SlideOverlay` for positioning and text rendering

---

## Banner Slider Component

**Component:** `components/storefront/banner-slider.tsx`

**Purpose:** Interactive carousel for homepage banner display with autoplay, touch controls, and responsive text positioning.

**Features:**
- Autoplay with pause-on-hover
- Touch gesture support (swipe left/right)
- Keyboard navigation (arrow buttons)
- Dot indicators for slide jumping
- Responsive text positioning via `text_x`, `text_y`, `font_scale` properties
- Gradient overlay for text readability
- Fallback gradient when image missing

**Data Flow:**
1. Server fetches banner-slider widget from API
2. Extracts slides array from widget.metadata
3. Passes slides to BannerSlider component
4. Component manages slide state with autoplay interval
5. User interaction (click, touch, hover) updates active slide

**Props:**

```typescript
interface BannerSliderProps {
  slides: BannerSlide[];
  autoPlayInterval?: number; // milliseconds, default 5000
}

interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  text_x?: number;         // % from left, default 5
  text_y?: number;         // % from top, default 80
  font_scale?: number;     // scale multiplier, default 1
}
```

**Usage:**

```typescript
import { BannerSlider } from "@/components/storefront/banner-slider";
import { fetchWidgets } from "@/lib/api-server";
import type { BannerSliderMetadata } from "@/types/api";

export default async function HomePage() {
  const widgets = await fetchWidgets("banner-slider");
  const slides = widgets[0]?.metadata as BannerSliderMetadata | undefined;

  return (
    <BannerSlider slides={slides?.slides ?? []} />
  );
}
```

**Behavior:**
- Single slide: No autoplay or controls (no indicators/arrows shown)
- Multiple slides: Full controls enabled
- Touch threshold: 50px minimum drag distance
- Autoplay pauses on mouse hover
- Arrow buttons always visible when multiple slides exist

---

## Server-Side Fetch Utility

**Module:** `lib/api-server.ts`

**Purpose:** Server-side API fetch wrapper with ISR caching and Next.js revalidation tags.

**Features:**
- Generic type-safe fetch with error handling
- ISR revalidation with configurable cache duration
- Automatic response data extraction (unwraps `.data` field)
- Graceful error handling (returns null on failure)
- Tag-based cache invalidation for on-demand revalidation

**Functions:**

```typescript
async function fetchFromAPI<T>(
  path: string,
  options?: FetchOptions
): Promise<T | null>

interface FetchOptions {
  revalidate?: number;    // seconds, default 60
  tags?: string[];        // for ISR tag-based revalidation
}

async function fetchWidgets(type?: string): Promise<Widget[]>
```

**Cache Strategy:**
- Default revalidation: 60 seconds
- Tags support: `["widgets"]` for `POST /api/revalidate?tag=widgets`
- Failed requests: Returns empty array for widgets, null for generic fetch
- Response format: Expects API response with `{ data: T }` structure

**Usage:**

```typescript
import { fetchWidgets, fetchFromAPI } from "@/lib/api-server";

// Fetch widgets by type
const bannerWidgets = await fetchWidgets("banner-slider");

// Generic fetch with custom revalidation
const data = await fetchFromAPI<Product[]>("/products", {
  revalidate: 3600,
  tags: ["products"],
});
```

**Error Handling:**
- Network errors: Returns null (graceful degradation)
- Non-200 responses: Returns null
- Invalid JSON: Returns null
- Empty response: Returns null

---

## Order Management Components

### OrderStatusBadge

**Component:** `components/common/order-status-badge.tsx`

**Purpose:** Display order status with color-coded visual indicators for all 8 order states.

**Props:**
```typescript
interface OrderStatusBadgeProps {
  status: number;  // 1-8 (AWAITING_PAYMENT through REFUNDED)
}
```

**Status Mapping:**
- Status 1 (AWAITING_PAYMENT) — Red badge
- Status 2 (PAYMENT_SUBMITTED) — Orange badge
- Status 3 (CONFIRMED) — Yellow badge
- Status 4 (SHIPPING) — Blue badge
- Status 5 (COMPLETED) — Green badge
- Status 6 (CANCELLED) — Gray badge
- Status 7 (REFUND_REQUESTED) — Purple badge
- Status 8 (REFUNDED) — Indigo badge

---

### OrderStatusTimeline

**Component:** `components/common/order-status-timeline.tsx`

**Purpose:** Visual timeline showing order status transition history with timestamps and notes.

**Props:**
```typescript
interface OrderStatusTimelineProps {
  history: OrderStatusHistory[];  // Array of status history records
}

interface OrderStatusHistory {
  id: string;
  fromStatus: number | null;
  toStatus: number;
  changedBy: string | null;
  note: string;
  createdAt: string;
}
```

**Display:** Vertical timeline with status badges, timestamps, and transition notes from order_status_history table.

---

### CancelOrderModal

**Component:** `components/orders/cancel-order-modal.tsx`

**Purpose:** Modal dialog for user order cancellation with conditional reason input.

**Props:**
```typescript
interface CancelOrderModalProps {
  orderId: string;
  currentStatus: number;  // Status 1-3 may require reason
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
}
```

**Behavior:**
- Statuses 2 (PAYMENT_SUBMITTED) and 3 (CONFIRMED) require reason field
- Status 1 (AWAITING_PAYMENT) optional reason
- Textarea validation, error messages, loading state during submission

---

## Widget Editors & Metadata Patterns

Widget editors pair with live preview components. Each editor component marshals form input into metadata JSON, while preview components render the storefront view.

### Widget Type-Specific Metadata Patterns

**BannerSliderMetadata:**
```typescript
{
  slides: BannerSlide[];
}

interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  text_x?: number;      // % from left
  text_y?: number;      // % from top
  font_scale?: number;  // scaling multiplier
}
```

**NewProductMetadata:**
```typescript
{
  tags: string[];           // Filter tags
  productIds: string[];     // Selected product IDs
  displayLimit?: number;    // Products to show (default: 8)
}
```

**CollectionGridMetadata:**
```typescript
{
  categoryId: string;
  displayLimit?: number;
}
```

**TrendHotMetadata:**
```typescript
{
  tags: string[];
  displayLimit?: number;
  sortBy: 'newest' | 'bestselling';
}
```

---

## User Profile & Address Management

**Profile Page** (`app/[locale]/(main)/profile/page.tsx`):
- Avatar upload, info editing, password change, address management
- Uses ImageUploader for avatar, AddressForm components for address CRUD
- API: `GET/PUT /api/v1/users/me`, `PUT /api/v1/users/me/password`, address endpoints

**Address Form Component** (`components/admin/address-form.tsx`):
- Zod validation for all address fields (street, ward, district, city, postal, phone)
- Default address toggle, submit/cancel actions

**User Dropdown** (`components/common/user-dropdown.tsx`):
- Shows logged-in user with avatar, profile link, logout with BroadcastChannel multi-tab sync
- Graceful auth state detection and redirect

---

## Widget System Architecture (Updated)

**Widget Metadata Strategy:**
- Each widget type stores config in `widget.metadata` JSONB column
- Frontend editors marshal/unmarshal metadata to TypeScript interfaces
- Type-safe metadata access via TypeScript discriminated unions
- Backend validates metadata shape at database level (optional constraint)

**Widget Types & Editors (4 Widget Types):**
| Type | Editor | Preview | Metadata |
|------|--------|---------|----------|
| banner-slider | BannerSliderEditor | BannerSliderPreview | slides: BannerSlide[] |
| collection-grid | CollectionGridEditor | CollectionGridPreview | categoryId, displayLimit |
| new-product | NewProductEditor | NewProductPreview | tags, productIds, displayLimit |
| trend-hot | TrendHotEditor | TrendHotPreview | tags, displayLimit, sortBy |

**Admin Widget Edit Flow:**
1. Admin navigates to `/admin/widgets/[id]/edit`
2. Page detects `widget.type` (e.g., "new-product")
3. Renders type-specific editor (NewProductEditor)
4. Editor updates metadata on change
5. Admin saves via `PUT /api/v1/widgets/:id` with updated metadata
6. Storefront auto-refreshes (ISR or cache bust) to show new widget

