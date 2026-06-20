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

## Phase 3: User Address Management (COMPLETE)
**Status:** ✓ Complete | **Target:** May 2026

- [x] User address model and separate user_addresses table
- [x] Remove address field from User model
- [x] Database migration to remove address column from users table
- [x] Backend address service and CRUD endpoints
- [x] Frontend address management UI (list, add, edit, delete)
- [x] Order shipping info update endpoint (PENDING status only)
- [x] i18n translations for address validation errors

**Completeness:** 100%

---

## Phase 4: Frontend Development & Admin Dashboard (IN PROGRESS)
**Status:** ⏳ In Progress | **Target:** May–June 2026

- [x] Next.js frontend setup with TailwindCSS and next-intl
- [x] Admin dashboard — Full CRUD for users, products, categories, tags
- [x] Product variants with image upload, attributes, pricing, discounts
- [x] Tiptap rich text editor for product descriptions
- [x] Admin widgets management (edit-only, 4 fixed widget types)
  - [x] banner-slider editor with multi-slide management
  - [x] new-product editor with tag-based filtering
  - [x] collection-grid and trend-hot editors
- [x] User product detail page with variant picker, image gallery, tag badges
- [x] Order management (history, detail, cancel, refund workflow)
  - [x] 8-status order lifecycle with state machine validation
  - [x] Order status history audit trail
  - [x] CancelOrderModal, OrderStatusBadge, OrderStatusTimeline components
- [x] Checkout flow (shipping form, order creation, success page)
- [x] User profile & address management
- [x] Order code system (ROL-YYMMDD-XXXX with atomic sequence generation)
- [x] Multi-tab logout sync via BroadcastChannel
- [ ] Public storefront pages (login, registration, shop, cart)

**Completeness:** 90%

---

## Phase 5: Advanced Features & Optimization (BACKLOG)
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
| API Endpoints | 50+ | 60+ |
| Test Coverage | TBD | 80%+ |
| Documentation | 98% (6 docs) | 100% |
| Production Ready | No | Q2 2026 |
| Database Migrations | 25 | 30+ |
| Controllers | 14 | - |
| Services | 14+ | - |
| Frontend Components | 40+ | - |

