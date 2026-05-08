# Project Changelog

All notable changes to the rol-outfit project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Tags & Product Detail Enhancement** (2026-05-09)
  - Backend: Tags CRUD system with time-window activation (`start_at`/`end_at` optional fields)
  - Backend: Unique slug constraint on tags; active-window filtering on public product GET
  - Backend: Product-tags junction table with transactional ReplaceProductTags (max 3 tags per product)
  - Backend: Admin endpoints — `GET /api/v1/admin/tags` (list all), `POST /` (create), `GET /:id`, `PUT /:id`, `DELETE /:id`
  - Backend: Admin assignment — `PUT /api/v1/products/:id/tags` with tag validation and count enforcement
  - Backend: Public product endpoints return tags array (active only, filtered by time window)
  - Backend: Migrations 000011 (tags table) and 000012 (product_tags junction)
  - Frontend: Tag CRUD admin pages — list with search/status filter, create form, edit form with datetime-local pickers
  - Frontend: Product tag assignment panel on admin product edit page — optimistic add/remove with revert-on-error
  - Frontend: Tag badge component with color coding
  - Frontend: User product detail rewrite — variant picker (color/size) with stock awareness, tag badges, multi-image gallery
  - Frontend: Variant picker resolves product variant by attribute combo; shows variant price/stock; disables unavailable combinations

- **Stateful Refresh Token System** (2026-05-09)
  - Backend: New `refresh_tokens` DB table (migration 000010) storing SHA256 hashes with family rotation for theft detection
  - Backend: `POST /api/v1/auth/refresh` single-use token rotation endpoint with automatic family invalidation on suspicious activity
  - Backend: `POST /api/v1/auth/logout` endpoint (204 idempotent) revokes all user refresh tokens
  - Backend: Reduced access token TTL from 24h to 15min; refresh token TTL set to 7 days
  - Backend: Cleanup goroutine runs every 6h to purge expired and old-revoked tokens
  - Frontend: `lib/api-client.ts` implements automatic 401 retry with promise deduplication (prevents token-refresh stampede)
  - Frontend: `lib/auth.ts` uses BroadcastChannel for multi-tab logout synchronization
  - Frontend: `api.auth.logout()` graceful logout with best-effort backend call and local state cleanup
  - Frontend: `api.ts` refactored into 3 focused modules for maintainability

- **Product Variant CRUD Endpoints** (2026-05-08)
  - Backend: Full CRUD endpoints for variants — `GET /api/v1/products/:productID/variants/`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
  - Variant attributes validated against product's `attribute_names`
  - Admin-only write operations (POST, PUT, DELETE)
  - Public read operations (GET list/detail)

- **Widget System** (2026-05-08)
  - Backend: Widget model with hierarchical support (parent_id, depth)
  - Widget types: container, chart, table, stat, text, image
  - Full CRUD endpoints — `GET /api/v1/widgets/`, `GET /:id` (public), `POST`, `PUT`, `DELETE` (admin)
  - JSON settings field for type-specific configuration
  - Display ordering and status management

- **Admin User Management API** (2026-05-08)
  - Backend: Full CRUD endpoints for users — `GET /api/v1/admin/users/`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
  - Admin-only access with role/status control
  - User DTO with role and status fields
  - Conflict handling for duplicate email/phone

- **Admin Product & Variant APIs** (2026-05-08)
  - Backend: Admin-specific endpoints — `GET /api/v1/admin/products/` (list with pagination), `GET /:id` (with all variants)
  - Returns products with full variant data (all statuses)
  - Pagination support on admin list

- **API Documentation Updates** (2026-05-08)
  - Complete API reference with all endpoints (variants, widgets, admin users/products)
  - Request/response examples for all operations
  - Error codes and validation rules documented

- **Code Standards & Architecture Documentation** (2026-05-08)
  - Frontend standards — Next.js App Router patterns, TypeScript conventions, Tailwind usage, React component patterns
  - Fiber v3 specific patterns — Factory pattern controllers, context usage, status codes
  - Frontend API integration pattern — centralized typed client with namespaced endpoints
  - Form handling with Zod + React Hook Form
  - Auth & state management conventions

- **Variant Edit & List Images** (2026-05-07)
  - Frontend: New edit variant page at `/admin/products/[id]/variants/[variantId]` with full form (avatar, attributes, price, stock, status)
  - Frontend: Product avatar display in admin products list page
  - Frontend: Variant images display in expandable "Biến Thể Sản Phẩm" sub-table on products list page
  - Frontend: New component `product-list-variants-table.tsx` for variant image display in list view
  - Frontend: Edit button added to variants table on product edit page (`product-variants-table.tsx`)

- **Product & Variant Image Upload** (2026-05-07)
  - Backend: `POST /api/v1/uploads` admin-only endpoint with MIME validation (JPEG, PNG, WebP, GIF), max size enforcement
  - Backend: Avatar field validation in `CreateProductRequest.Validate()` with i18n error keys (vi.json, ja.json)
  - Frontend: `api.uploads.upload(file)` and `api.uploads.delete(filename)` helpers in `lib/api.ts`
  - Frontend: New reusable `components/admin/image-uploader.tsx` with upload-then-reference flow, best-effort old file deletion, file size validation, spinner overlay
  - Frontend: Add Product page — product avatar (required) + per-variant avatar (optional) image upload fields
  - Frontend: Edit Product page — avatar field in `product-info-panel.tsx` (form/view/edit with cancel-cleanup), variant avatars in `product-variants-table.tsx` (Ảnh column with ImageUploader in add row)
  - Type update: `CreateProductPayload.avatar` changed from optional to required

- **Admin Product Management with Variants** (2026-05-07)
  - Backend: `GET /api/v1/admin/products/:id` endpoint returns product with all variants (any status)
  - Backend: Variant attribute validation — variant attributes must match `product.attribute_names`
  - Frontend: Add product page wired to real API with dynamic attribute/variant fields
  - Frontend: Edit product page fully rewritten — API-driven, inline info/attribute editing, complete variant CRUD
  - New frontend components: `product-info-panel`, `product-attr-names-panel`, `product-variants-table`

- **Admin User CRUD** (2026-05-04)
  - Backend: `POST /api/v1/admin/users` endpoint for admin user creation with role/status control
  - Frontend: User type, API client namespace (`api.adminUsers`), and role/status label mappings
  - Frontend: Admin user list, create, edit pages with real API integration, loading/error states
  - Database error handling: `ErrDuplicateEmail`, `ErrNotFound` sentinels with pgconn mapping

- **Database Seed Script** (2026-04-28)
  - New standalone seed command: `backend/src/cmd/seed/main.go`
  - Make target `make seed` seeds database with 3 users (1 admin + 2 customers), 4 categories, and 12 products
  - Idempotent design — safe to re-run, skips existing rows via upsert logic
  - Enables fast local development without manual data entry

- **Unicode Normalization in Slugs** (2026-04-28)
  - Enhanced `common.Slugify` function using `golang.org/x/text` for proper Unicode normalization
  - Fixes slug generation for accented characters (e.g., "Áo Nam" → "ao-nam" instead of "o-nam")
  - Applied retroactively to category and product slug generation

- **Product Avatar & File Upload** (2026-04-28)
  - New `avatar TEXT NULL` column to products table (migration 000008)
  - Avatar field integration into Product model, DTOs, Create/Update requests
  - File upload endpoints: `POST /api/v1/uploads` (authenticated), `DELETE /api/v1/uploads/:filename` (admin)
  - Upload service with MIME validation (JPEG, PNG, WebP, GIF), max size enforcement, and safe file deletion
  - Local filesystem storage at `backend/uploads/`, proxied via Nginx `/uploads/` static path
  - Configuration: `UploadDir`, `UploadURL`, `UploadMaxSize` environment variables
  - Docker volume for uploads shared between backend (rw) and Nginx (ro)
  - Nginx client body limit increased to 10MB for `/api/` location

## [v0.1.0] - 2026-04-28

### Added
- **Project Initialization**
  - Go 1.26 + Fiber v3 backend with PostgreSQL
  - Docker dev environment with hot reload (Air for Go, Next.js HMR)
  - Nginx reverse proxy at http://localhost
  - Makefile with common commands (up, down, rebuild, logs, db-shell, backend-shell, frontend-shell)

- **User Authentication & Authorization**
  - User registration and login endpoints
  - JWT authentication with Bearer tokens
  - RBAC (Role-Based Access Control) middleware
  - Password hashing and validation

- **Full CRUD Operations**
  - **Categories**: Create, Read, Update, Delete with slug generation
  - **Products**: Create, Read, Update, Delete with category relationships
  - **Cart**: Add/remove items, retrieve user cart
  - **Orders**: Create orders from cart, view order history

- **Architecture & Infrastructure**
  - Repository pattern with transaction support
  - Service layer with business logic
  - DTO/Request/Response types for API contracts
  - GORM models with proper relationships
  - i18n support (Vietnamese, Japanese locales)
  - Error handling with consistent response format
  - Validation using ozzo-validation

