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

**Completeness:** 100%

---

## Phase 2: File Management & Media (IN PROGRESS)
**Status:** ⏳ In Progress | **Target:** May 2026

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
- [ ] Product image gallery (multiple images per product)
- [ ] Image optimization and resizing
- [ ] CDN integration planning

**Completeness:** 80%

---

## Phase 3: Frontend Development & Admin Dashboard (IN PROGRESS)
**Status:** ⏳ In Progress | **Target:** May 2026

- [x] Next.js frontend setup with TailwindCSS
- [x] Admin dashboard — User CRUD (list, create, edit, delete)
- [x] Admin dashboard — Product CRUD with variants (add, edit, delete products + variant management)
- [x] Admin dashboard — Product & variant image upload UI with reusable ImageUploader component
- [x] Product variant list view with images
- [x] Variant edit form with all fields (avatar, attributes, price, stock, status)
- [ ] Authentication UI (login, registration) — public pages
- [ ] Product catalog and search — public pages
- [ ] Shopping cart UI — public pages
- [ ] Order history and tracking — public pages
- [ ] Admin orders management UI
- [ ] Admin widgets management UI

**Completeness:** 50%

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
| API Endpoints | 20+ | 50+ |
| Test Coverage | TBD | 80%+ |
| Documentation | In Progress | 100% |
| Production Ready | No | Q2 2026 |

