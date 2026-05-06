# Project Changelog

All notable changes to the rol-outfit project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
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

