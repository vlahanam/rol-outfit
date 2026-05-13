# Development Roadmap

High-level project phases and milestones. For detailed implementation plans, see `/plans/`.

## Phase 1: Foundation & Authentication (COMPLETE)
**Status:** ✓ Complete | **Target:** April 2026

- [x] Docker dev environment with hot reload
- [x] User authentication (registration, login, JWT)
- [x] Role-based access control (RBAC)
- [x] Full CRUD for core entities (Categories, Products, Cart, Orders)
- [x] i18n support (Vietnamese, Japanese)
- [x] API error handling and validation
- [x] Database seed script for local development
- [x] Unicode normalization in slug generation
- [x] Stateful refresh token system (May 2026) — theft detection, family rotation, multi-tab sync

**Completeness:** 100%

---

## Phase 2: File Management & Media (COMPLETE)
**Status:** ✓ Complete | **Target:** May 2026

- [x] Product avatar storage and retrieval
- [x] File upload service with MIME validation
- [x] Secure file deletion (admin-only)
- [x] Frontend image upload component and API helpers
- [x] Admin product form integration — product avatar (required) + variant avatars (optional)
  - [x] Backend: Avatar required validation on CreateProductRequest
  - [x] Frontend: ImageUploader component with upload-then-reference flow
  - [x] Frontend: Add Product page with product & variant avatars
  - [x] Frontend: Edit Product page with product & variant avatars
- [x] Product and variant images display in admin list pages
  - [x] Product avatar display in admin products list
  - [x] Variant images display in expandable variants sub-table (list page)
- [x] Variant edit page with full form (avatar, attributes, price, stock, status)
- [x] Product variant CRUD endpoints (list, get, create, update, delete)
- [x] Product image gallery (multiple images per product)
  - [x] Backend: Product GET endpoints now include tags
  - [x] Frontend: Multi-image gallery component with variant images
- [x] Product discount system (time-windowed activation, variant override)
  - [x] Backend: Discount fields on products and variants with time-window support
  - [x] Backend: Effective price computation with fallback hierarchy (variant → product → base)
  - [x] Frontend: Sale badge and strikethrough price display in product item
  - [x] Frontend: Admin discount forms for products and variants
  - [x] Frontend: Shop page sorting by effective price
- [x] Stateful refresh token system with theft detection & multi-tab sync
- [ ] Image optimization and resizing (Post-launch optimization)
- [ ] CDN integration planning (Post-launch optimization)

**Completeness:** 100%

---

## Phase 3: Frontend Development & Admin Dashboard (IN PROGRESS)
**Status:** ⏳ In Progress | **Target:** May–June 2026

- [x] Next.js frontend setup with TailwindCSS and next-intl
- [x] Admin dashboard — User CRUD (list, create, edit, delete)
- [x] Admin dashboard — Product CRUD with variants (add, edit, delete products + variant management)
- [x] Admin dashboard — Product & variant image upload UI with reusable ImageUploader component
- [x] Admin dashboard — Category CRUD with slug generation
- [x] Product variant list view with images and edit capability
- [x] Variant edit form with all fields (avatar, attributes, price, stock, status, discount)
- [x] Admin dashboard — Tag CRUD (list, create, edit, delete) with time-window activation
  - [x] Backend: Tags table with start_at/end_at time windows
  - [x] Backend: Product-tag assignment with max-3 tags per product
  - [x] Frontend: Tags management pages (list, create, edit) with datetime pickers
  - [x] Frontend: Product tag assignment panel on product edit page
- [x] User product detail page enhancement
  - [x] Variant picker (color/size) with availability awareness
  - [x] Active tag badges display with filtering
  - [x] Multi-image gallery (product + variant images)
  - [x] Dynamic price updates on variant selection
  - [x] Sale badge and strikethrough price display
- [x] Admin cart viewing UI
- [x] Tiptap rich text editor for product descriptions
- [x] Admin widgets management UI
  - [x] Backend: Admin-only widget endpoints (list, get) with no status filter
  - [x] Frontend: Widgets list page with hierarchical container→children display
  - [x] Frontend: Widget add form with parent selector and image settings
  - [x] Frontend: Widget edit form with all configuration options
  - [x] Frontend: Drag-and-drop widget reorder (root + children within parent)
- [x] New arrivals page with tag-based filtering — products tagged "NEW" fetched via real API with sort controls
- [ ] Authentication UI (login, registration) — public pages
- [ ] Product catalog and search — public pages
- [ ] Shopping cart UI — public pages
- [ ] Order history and tracking — public pages
- [ ] Admin orders management UI

**Completeness:** 76%

---

## Phase 4: Advanced Features & Optimization (BACKLOG)
**Status:** 📦 Backlog | **Target:** June 2026+

- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Widget system dashboard UI (admin)
- [ ] Analytics and reporting
- [ ] Image optimization and CDN integration
- [ ] Performance optimization (Redis caching, database indexing)
- [ ] S3/cloud storage integration

**Completeness:** 0%

---

## Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| API Endpoints | 45+ | 60+ |
| Test Coverage | TBD | 80%+ |
| Documentation | ~95% | 100% |
| Production Ready | No | Q2 2026 |
| Database Migrations | 14 | 14+ |

