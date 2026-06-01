# System Architecture

Comprehensive overview of rol-outfit's system design, components, and data flow.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/HTTPS
                         │
        ┌────────────────▼────────────────┐
        │    Nginx Reverse Proxy          │
        │  (Port 80, routes to backend)   │
        │  - /api       → Backend:8080    │
        │  - /         → Frontend:3000    │
        │  - /uploads  → Filesystem (RO)  │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                 │
    ┌───▼────┐       ┌───▼────┐       ┌──▼────────┐
    │ Frontend│       │ Backend │       │ Uploads   │
    │ Next.js │       │Go/Fiber │       │FileSystem │
    │:3000   │       │ :8080   │       │(Docker Vol)│
    └────────┘       └────┬────┘       └───────────┘
                          │
                    ┌─────▼─────┐
                    │PostgreSQL  │
                    │:5432       │
                    └────────────┘
```

## Core Components

### Backend (Go + Fiber)
**Location:** `backend/src/`

#### 1. Controllers Layer (`controllers/`)
Entry point for HTTP requests. Handles:
- Request validation and unmarshalling
- JWT authentication/authorization
- Response formatting and error handling
- Status code selection

**Files:**
- `auth_controller.go` — User registration, login
- `category_controller.go` — Category CRUD
- `product_controller.go` — Product CRUD with avatar
- `cart_controller.go` — Cart operations
- `order_controller.go` — Order management
- `upload_controller.go` — File upload/deletion

#### 2. Service Layer (`services/`)
Business logic and domain operations. Orchestrates repositories and external services.

**Key Services:**
- `auth_service.go` — User registration, password hashing, JWT generation
- `category_service.go` — Category creation, slug generation
- `product_service.go` — Product operations with avatar support
- `cart_service.go` — Cart item management
- `order_service.go` — Order creation from cart items
- `upload_service.go` — File save/delete with MIME validation

**Upload Service Highlights:**
- MIME type detection from file bytes (not Content-Type header)
- Allowed formats: JPEG, PNG, WebP, GIF
- UUID-based filename generation for uniqueness
- Safe deletion with path traversal validation
- Rollback on write failure

#### 3. Repository Layer (`repositories/`)
Database abstraction using GORM. Implements repository pattern with:
- Transaction support
- Query filters (status, user ownership)
- Error handling

**Repositories:**
- User, Category, Product, Cart, CartItem, Order, OrderItem

#### 4. Models (`models/`)
GORM data models with relationships.

**Key Fields in Product Model:**
```go
type Product struct {
    ID        uint
    Name      string
    Slug      string
    Description string
    Price     decimal.Decimal
    Image     string
    Avatar    string          // NEW: nullable avatar URL
    Category  Category
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

#### 5. DTOs (`dto/`)
Request/response types for API contracts.

**Product DTO Fields:**
- `Name`, `Slug`, `Description`, `Price`, `Image`, `Avatar`
- Used in Create/Update request bodies and responses

**Variant DTO Fields:**
- `ID`, `ProductID`, `Attributes` (JSON), `Price`, `Stock`, `Sold`, `Avatar`, `Status`
- Attributes validated against product's `attribute_names`

**Widget DTO Fields:**
- `ID`, `ParentID` (nullable, for nested widgets), `Name`, `Type`, `DisplayOrder`, `Depth`, `Status`, `Settings` (JSON)
- Types: container, chart, table, stat, text, image

#### 6. Middleware (`middleware/`)
- `jwt_auth.go` — JWT validation, role extraction
- Request logging and error handling

#### 7. Configuration (`initialize/`)
- `loadconfig.go` — Loads env vars:
  - `UPLOAD_DIR` (default: `/app/uploads`)
  - `UPLOAD_URL` (default: `/uploads`)
  - `UPLOAD_MAX_SIZE` (default: 10 MB)
- `route.go` — Registers routes and middleware

### Database (PostgreSQL)

**Connection:** Defined in `loadconfig.go`, uses GORM

**Key Tables:**
- `users` — Authentication and profiles (with `avatar` field for user avatars)
- `user_addresses` — User address management with default address tracking
- `user_oauth_providers` — OAuth provider mappings (Google, Facebook)
- `categories` — Product categories with slugs
- `products` — Product catalog with avatar, discount, and Japanese i18n fields
- `product_variants` — Variants with attributes, pricing, and Japanese i18n fields
- `tags` — Taggable categories with time-window activation and Japanese i18n fields
- `product_tags` — Product-to-tags many-to-many relationship
- `widgets` — Page layout widgets with metadata JSONB and Japanese i18n fields
- `cart_items` — User shopping carts with item-level pricing
- `orders` — Order history with order codes (ROL-YYMMDD-XXXX format)
- `order_items` — Order line items
- `refresh_tokens` — Stateful token rotation with family-based theft detection
- `order_code_sequences` — Atomic sequence generation per date

### File Storage

**Location:** `backend/uploads/` (Docker volume)

**Behavior:**
- Files stored with UUID + extension (e.g., `a1b2c3d4-e5f6.jpg`)
- Served via Nginx at `/uploads/{filename}` (read-only mount)
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
- Max size: 10 MB (configurable via `UPLOAD_MAX_SIZE`)

### Widget System

**Purpose:** Configurable UI components for dashboards and page layouts.

**Components:**
- **Model** (`models/widget.go`) — Widget entity with hierarchical support (parent_id for nesting)
- **Repository** (`repositories/widget_repo.go`) — CRUD operations
- **Service** (`services/widget_service.go`) — Business logic
- **Controller** (`controllers/widget_controller.go`) — HTTP handlers
- **DTO** (`dto/widget_dto.go`) — Serialization format

**Features:**
- Configurable types: container, chart, table, stat, text, image
- Hierarchical nesting via parent_id (depth field auto-calculated)
- Display ordering via display_order field
- JSON settings for type-specific configuration
- Status flag (1=active, 2=inactive)

**API Endpoints:**
- `GET /api/v1/widgets` — List all widgets (public)
- `GET /api/v1/widgets/:id` — Get widget details (public)
- `POST /api/v1/widgets` — Create widget (admin)
- `PUT /api/v1/widgets/:id` — Update widget (admin)
- `DELETE /api/v1/widgets/:id` — Delete widget (admin)

---

### Frontend (Next.js 16 + React 19)

**Location:** `frontend/` (separate from backend)

#### 1. App Structure (Next.js App Router)
- `app/[locale]/` — i18n route segment wrapping all pages
- `(public)/` — Public pages (shop, product detail, cart, auth)
- `(admin)/` — Admin dashboard (product CRUD, user CRUD, orders)
- Locale-based routing: English and Vietnamese/Japanese support

#### 2. Components Layer
- **Admin Components** (`admin/`) — Product/variant forms, image uploader, widget editors, user management
- **Shared Components** (`shared/`) — SlideOverlay (text overlay for slides), reusable across admin and storefront
- **Storefront Components** (`storefront/`) — BannerSlider, product displays, customer-facing UI
- **Product Components** (`product/`) — VariantPicker, ImageGallery, TagBadges
- **Common Components** (`common/`) — Header, Footer, ProductCard, DeleteConfirmModal, AdminSidebar

**Key Components:**

**ImageUploader** (`admin/image-uploader.tsx`)
- Reusable upload-then-reference pattern
- File validation (size, type)
- Best-effort old file deletion
- Shows spinner overlay during upload
- Returns file URL to parent form

**SlideOverlay** (`shared/slide-overlay.tsx`)
- Reusable text overlay component for banner slides
- Dynamic positioning with percentage-based coordinates (text_x, text_y)
- Font scaling via CSS transforms for responsive text sizing
- Conditional CTA link rendering (production vs preview modes)
- Shared between admin preview and storefront display for WYSIWYG consistency

#### 3. API Client (lib/api-client.ts & lib/api.ts)
- **lib/api-client.ts** (146 LOC) — Base fetch client with:
  - 401 auto-retry with promise deduplication (prevents token-refresh stampede)
  - Bearer token authentication via localStorage
  - Custom ApiError class for error handling
  - ApiResponse<T> wrapper with pagination support
- **lib/api.ts** (68 LOC) — HTTP methods (GET, POST, PUT, DELETE) and namespaced endpoints
- **lib/api-resources.ts** (204 LOC) — Namespaced API methods: `adminUsers`, `adminProducts`, `adminCategories`, `adminTags`, `uploads`
- **lib/auth.ts** (71 LOC) — Token storage with localStorage, cross-tab logout via BroadcastChannel
- Namespace organization: `api.products`, `api.cart`, `api.adminUsers`, `api.tags`, `api.auth`, etc.

#### 4. State Management
- React Context for minimal global state (auth user, theme)
- Props drilling for component communication
- localStorage for JWT token persistence
- Form state via React Hook Form + Zod validation

#### 5. UI Framework
- TailwindCSS v4 for styling
- lucide-react for icons
- sonner for toast notifications
- @dnd-kit for drag-and-drop (if needed)

---

### Nginx Reverse Proxy

**Config:** `nginx/conf.d/default.conf`

**Routes:**
```
/api/* → http://backend:8080/api/*   (10MB body limit)
/      → http://frontend:3000/       (Next.js HMR)
/uploads/* → /usr/share/nginx/html/uploads/ (static filesystem)
```

**Docker Setup:**
- Nginx reads uploads from shared volume (read-only)
- Backend writes to uploads (read-write)

### Discount System

**Purpose:** Time-windowed product and variant discounts with effective price computation.

**Database Fields:**
- Product: `discount_percent` (NUMERIC 5,2), `discount_start_at`, `discount_end_at` (TIMESTAMP, nullable)
- Variant: `discount_percent` (NUMERIC 5,2), `discount_start_at`, `discount_end_at` (TIMESTAMP, nullable)

**Helper Functions** (`dto/discount_helper.go`):
- `IsDiscountActive(percent float64, startAt, endAt *time.Time) bool` — Checks if discount is within active window
- `EffectivePrice(basePrice, discountPercent float64, startAt, endAt *time.Time) float64` — Computes sale price

**Price Fallback Chain:**
1. Check variant discount (if product has variants selected)
2. Fall back to product discount
3. Use base price if no discount active

**Migrations:**
- `000013_add_discount_to_products.sql` — Adds discount columns to products
- `000014_add_discount_to_variants.sql` — Adds discount columns to variants

**API Integration:**
- All product/variant DTOs expose `sale_price` (server-computed effective price via discount_helper)
- Cart items lock price at add time (no real-time recalc on discount changes)

---

### Tag System

**Purpose:** Time-windowed product tags with public/admin filtering.

**Database Tables:**
- `tags` — Name, Slug (UNIQUE), StartAt/EndAt (*TIMESTAMP, nullable for time-window activation)
- `product_tags` — Junction table (product_id, tag_id) with max 3 tags per product

**Database Indexes:**
- `idx_tags_window` on (start_at, end_at) for efficient active-window queries
- `idx_product_tags_product` on product_id for variant lookups

**Key Features:**
- Time-window activation: tags only appear during [start_at, end_at] period
- Public endpoints filter by active window; admin endpoints show all tags
- Transactional `ReplaceProductTags()` updates all tags for a product atomically
- Validation: max 3 tags per product, tag must exist before assignment

**API Endpoints:**
- `GET /api/v1/tags` — List active tags (filtered by time window)
- `GET /api/v1/admin/tags` — List all tags (admin, no filtering)
- `POST /api/v1/admin/tags` — Create tag
- `GET /api/v1/admin/tags/:id` — Get tag details
- `PUT /api/v1/admin/tags/:id` — Update tag
- `DELETE /api/v1/admin/tags/:id` — Delete tag
- `PUT /api/v1/products/:id/tags` — Assign tags to product

**Migrations:**
- `000011_create_tags_table.sql` — Tags table with time-window fields
- `000012_create_product_tags_junction.sql` — Junction table

---

### User Address Management

**Purpose:** Decoupled address storage for flexible user profile and order shipping management.

**Database Table** (`user_addresses`):
- `ID` (PK) — Address identifier
- `UserID` (FK to users) — Address owner
- `StreetAddress` (VARCHAR 255) — Street address
- `Ward` (VARCHAR 100) — Ward/district subdivision
- `District` (VARCHAR 100) — District/subdivision
- `City` (VARCHAR 100) — City/province
- `PostalCode` (VARCHAR 20) — ZIP/postal code
- `Phone` (VARCHAR 20) — Contact phone number
- `IsDefault` (BOOLEAN) — Default address flag
- `CreatedAt`, `UpdatedAt` (TIMESTAMP)

**API Endpoints:**
- `GET /api/v1/users/me/addresses` — List own addresses
- `POST /api/v1/users/me/addresses` — Create address
- `PUT /api/v1/users/me/addresses/:id` — Update address
- `DELETE /api/v1/users/me/addresses/:id` — Delete address
- `GET /api/v1/admin/users/:userID/addresses` — Admin list user addresses (admin-only)
- `PUT /api/v1/orders/:id/shipping` — Update order shipping info (PENDING status only)

**Validation:**
- All fields required except IsDefault
- Phone number format validated (length, digits)
- i18n error keys for Vietnamese/Japanese locales

**Migration:**
- `000018_create_user_addresses_table.sql` — Create table
- `000019_remove_address_from_users.sql` — Remove address field from users table, migrate existing data

---

### User Profile Management

**Purpose:** Support user avatar uploads and profile information updates.

**Database Additions:**
- `users.avatar` (VARCHAR 500, nullable) — User avatar file path

**API Endpoints:**
- `GET /api/v1/users/me` — Retrieve own profile
- `PUT /api/v1/users/me` — Update profile (avatar, name fields)
- `PUT /api/v1/users/me/password` — Change password with bcrypt verification

**Password Change Flow:**
1. User provides current password + new password
2. Backend verifies current password against stored hash
3. If valid, rehash new password and update
4. i18n error messages for invalid password/mismatch
5. Automatic JWT refresh after successful change

**Profile Picture Integration:**
- User uploads file via `POST /api/v1/uploads`
- Receives URL like `/uploads/{uuid}.{ext}`
- Updates profile via `PUT /api/v1/users/me` with avatar field
- Avatar displayed in UserDropdown and profile page

---

### Refresh Token Architecture

**Purpose:** Stateful refresh token rotation with theft detection and multi-tab synchronization.

**Database Table** (`refresh_tokens`):
- `TokenHash` (VARCHAR 64, SHA256) — Never store plaintext tokens
- `TokenFamily` (UUID) — Groups rotated tokens from same login
- `UserID` (FK to users)
- `ExpiresAt` (TIMESTAMP)
- `RevokedAt` (TIMESTAMP, nullable) — Marks compromised tokens

**Theft Detection:**
- If a revoked token from a family is reused → entire family invalidated (family_id)
- Cleanup goroutine runs every 6 hours, purges expired and old-revoked tokens

**Token Lifecycle:**
1. User logs in → backend issues refresh token with new family UUID
2. Token stored in DB as SHA256 hash (never plaintext)
3. Client stores in secure httpOnly cookie (production) or localStorage
4. On access token expiry → client calls `POST /api/v1/auth/refresh` with refresh token
5. Backend validates hash, rotates token, returns new access + refresh token
6. **Rotation:** Old token marked, new token issued with same family UUID
7. **Multi-tab sync:** Frontend uses BroadcastChannel to sync logout across browser tabs

**API Endpoints:**
- `POST /api/v1/auth/refresh` — Single-use token rotation with family validation
- `POST /api/v1/auth/logout` — Revoke all user refresh tokens (204 No Content, idempotent)

**Migration:**
- `000010_create_refresh_tokens_table.sql`

---

### Updated DTO Schema

**Product DTO** (includes discount-adjusted pricing):
- Base fields: `ID`, `Name`, `Slug`, `Description`, `Price`
- Image fields: `Image`, `Avatar`
- Discount fields: `DiscountPercent`, `DiscountStartAt`, `DiscountEndAt`
- Computed: `SalePrice` (effective price via discount_helper)
- Relations: `Variants` (nested), `Tags` (active only)

**Variant DTO** (includes discount-adjusted pricing):
- Base fields: `ID`, `ProductID`, `Price`, `Stock`, `Sold`
- Attributes: `Attributes` (JSON) — validated against product's `attribute_names`
- Image: `Avatar`
- Discount fields: `DiscountPercent`, `DiscountStartAt`, `DiscountEndAt`
- Computed: `SalePrice` (effective price, variant discount overrides product)
- Status: `Status` (1=active, 2=inactive)

**Tag DTO:**
- Base fields: `ID`, `Name`, `Slug`
- Time-window: `StartAt`, `EndAt` (optional)

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| POST | `/api/v1/auth/register` | None | - | User registration |
| POST | `/api/v1/auth/login` | None | - | User login, returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | None | - | Token rotation, requires refresh token |
| POST | `/api/v1/auth/logout` | JWT | User | Revoke all refresh tokens |

### Products (Public)
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| GET | `/api/v1/products` | None | - | List products with optional tag filtering (query: `?tags=slug1,slug2` [multiple], `?tag=slug` [single, backward compat], `?category_id=`, `?page=`, `?limit=`). Tag filters use intersection (product must match ALL tags). Time-window validation applied per tag. |
| GET | `/api/v1/products/:id` | None | - | Get product details with variants & tags |

### Products (Admin)
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| POST | `/api/v1/products` | JWT | Admin | Create product |
| PUT | `/api/v1/products/:id` | JWT | Admin | Update product |
| DELETE | `/api/v1/products/:id` | JWT | Admin | Delete product |
| GET | `/api/v1/admin/products` | JWT | Admin | List products with all variant statuses |
| GET | `/api/v1/admin/products/:id` | JWT | Admin | Get product with all variants |
| PUT | `/api/v1/products/:id/tags` | JWT | Admin | Assign tags to product |

### Product Variants
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| GET | `/api/v1/products/:productID/variants` | None | - | List product variants |
| GET | `/api/v1/products/:productID/variants/:id` | None | - | Get variant details |
| POST | `/api/v1/products/:productID/variants` | JWT | Admin | Create variant |
| PUT | `/api/v1/products/:productID/variants/:id` | JWT | Admin | Update variant |
| DELETE | `/api/v1/products/:productID/variants/:id` | JWT | Admin | Delete variant |

### Tags
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| GET | `/api/v1/tags` | None | - | List active tags (filtered by time window) |
| GET | `/api/v1/admin/tags` | JWT | Admin | List all tags |
| POST | `/api/v1/admin/tags` | JWT | Admin | Create tag |
| GET | `/api/v1/admin/tags/:id` | JWT | Admin | Get tag details |
| PUT | `/api/v1/admin/tags/:id` | JWT | Admin | Update tag |
| DELETE | `/api/v1/admin/tags/:id` | JWT | Admin | Delete tag |

### File Upload
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| POST | `/api/v1/uploads` | JWT | User | Upload file, returns URL |
| DELETE | `/api/v1/uploads/:filename` | JWT | Admin | Delete uploaded file |

### Categories, Cart, Orders, Users, Widgets
See CRUD endpoints for each entity (similar structure to Products). Full list includes admin namespaces for protected operations.

---

## Multi-Tag Filtering Query Pattern

### Query Implementation

**Endpoint:** `GET /api/v1/products?tags=slug1,slug2&category_id=5`

**Backend Controller** (`product_controller.go`):
1. Parse comma-separated `tags` param or single `tag` param (backward compat)
2. Convert to `[]string` with trimming (e.g., "new, hot" → ["new", "hot"])
3. Pass to service: `svc.List(ctx, categoryID, tagSlugs, offset, limit)`

**Service Layer** (`product_service.go`):
- Delegates to repository: `repo.ListProducts(ctx, categoryID, tagSlugs, offset, limit)`

**Repository Query** (`product_repo.go`):
```go
if len(tagSlugs) > 0 {
    now := time.Now()
    db = db.
        Joins("JOIN product_tags ON product_tags.product_id = products.id").
        Joins("JOIN tags ON tags.id = product_tags.tag_id").
        Where("tags.slug IN ?", tagSlugs).
        Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
        Group("products.id")
}
```

**SQL Generated:**
```sql
SELECT products.* FROM products
JOIN product_tags ON product_tags.product_id = products.id
JOIN tags ON tags.id = product_tags.tag_id
WHERE products.deleted_at IS NULL AND products.status = 1
  AND tags.slug IN ('new', 'hot')
  AND (tags.start_at IS NULL OR tags.start_at <= NOW())
  AND (tags.end_at IS NULL OR tags.end_at >= NOW())
GROUP BY products.id;
```

**Semantics:**
- **Multiple tags:** Products tagged with ANY specified tag (UNION, not intersection)
- **Time windows:** Each tag's start_at/end_at checked independently
- **Grouping:** `GROUP BY products.id` prevents duplicates from multi-join
- **Backward compatibility:** Single `?tag=slug` parameter still works (auto-converted)

---

## Data Flow: Product with Avatar

### Uploading a Product Avatar

```
1. Client uploads file via POST /api/v1/uploads
   └─ UploadController.UploadFile()
      ├─ Validate JWT token (middleware)
      ├─ Extract multipart file
      └─ Call uploadService.Save()
         ├─ Check file size < maxSize
         ├─ Read first 512 bytes for MIME detection
         ├─ Validate MIME type (image/jpeg, image/png, image/webp, image/gif)
         ├─ Save with UUID filename to /app/uploads/{uuid}.{ext}
         ├─ Return full URL: /uploads/{uuid}.{ext}
         └─ Return 201 Created with {"url": "..."}

2. Client receives URL and creates product with avatar field:
   POST /api/v1/products
   {
     "name": "T-Shirt",
     "avatar": "/uploads/a1b2c3d4.jpg",
     ...
   }

3. ProductController validates and calls productService.CreateProduct()
   └─ productService inserts into DB with avatar URL
   └─ Returns product DTO with avatar field
```

### Serving Avatar in Product Detail

```
1. GET /api/v1/products/123
   └─ ProductController.GetProduct()
      └─ productService.GetProductByID()
         └─ Repository queries product with avatar field
         └─ DTO marshals avatar as string URL
         └─ Returns {"id": 123, "avatar": "/uploads/a1b2c3d4.jpg", ...}

2. Client renders <img src="/uploads/a1b2c3d4.jpg" />
   └─ Browser requests /uploads/a1b2c3d4.jpg
      └─ Nginx serves from volume at backend/uploads/ (static)
```

## Security Considerations

### File Upload
- **MIME Validation:** Detects from file bytes, ignores client Content-Type header
- **Filename Isolation:** UUID prevents directory traversal and name collisions
- **Path Traversal Protection:** Delete validates no `../` in filename
- **Size Limits:** Enforced at service and Nginx levels (10 MB body limit)
- **Authentication:** POST /api/v1/uploads requires valid JWT
- **Authorization:** DELETE requires Admin role

### Database
- Parameterized queries (GORM prevents SQL injection)
- Transaction support for atomic operations
- Role-based repository methods (cart only retrieves own items)

### API
- JWT authentication on protected endpoints
- Bearer token validation in middleware
- Role extraction for admin-only operations
- HTTPS enforcement via Nginx (production)

## Docker Volumes & Mounts

| Service | Volume | Mount Point | Mode | Purpose |
|---------|--------|-------------|------|---------|
| backend | `uploads` | `/app/uploads` | rw | Write uploaded files |
| nginx | `uploads` | `/usr/share/nginx/html/uploads` | ro | Serve static files |
| postgres | `pgdata` | `/var/lib/postgresql/data` | rw | Database persistence |

## Database Migrations Summary

| Migration | File | Purpose |
|-----------|------|---------|
| 000001 | `create_users_table.sql` | User authentication and profiles |
| 000002 | `create_categories_table.sql` | Product categories with slugs |
| 000003 | `create_products_table.sql` | Product catalog |
| 000004 | `create_product_variants_table.sql` | Product variants with attributes |
| 000005 | `create_carts_table.sql` | User shopping carts |
| 000006 | `create_cart_items_table.sql` | Cart line items |
| 000007 | `create_orders_table.sql` | Order history |
| 000008 | `add_avatar_to_products.sql` | Avatar field for products |
| 000009 | `create_order_items_table.sql` | Order line items |
| 000010 | `create_refresh_tokens_table.sql` | Stateful refresh token rotation |
| 000011 | `create_tags_table.sql` | Tags with time-window activation |
| 000012 | `create_product_tags_junction.sql` | Product-to-tags many-to-many |
| 000013 | `add_discount_to_products.sql` | Discount fields on products |
| 000014 | `add_discount_to_variants.sql` | Discount fields on variants |
| 000015 | `add_metadata_to_widgets.sql` | Metadata JSONB column for widgets |
| 000016 | `seed_fixed_widgets.sql` | Seed 4 fixed widgets (banner, collection, new-arrivals, trend-hot) |
| 000017 | `add_display_order_to_widgets.sql` | Display order field for widget ordering |
| 000018 | `create_user_addresses_table.sql` | User address management |
| 000019 | `remove_address_from_users.sql` | Migrate address to separate table |
| 000020 | `add_order_code_to_orders.sql` | Order code field (ROL-YYMMDD-XXXX format) |
| 000021 | `create_order_code_sequences.sql` | Atomic sequence generation for order codes |
| 000022 | `add_avatar_to_users.sql` | User avatar field for profiles |
| 000023 | `add_japanese_i18n_columns.sql` | Japanese (_ja) columns on products, variants, categories, tags, widgets |
| 000024 | `add_password_change_support.sql` | Support for password change operations |
| 000025 | `add_oauth_providers_table.sql` | OAuth provider management |

---

## Development Environment

**Entry:** `docker/docker-compose.yml`

**Services:**
- `postgres:latest` — PostgreSQL database
- `backend` — Go/Fiber (port 8080, Air hot reload)
- `frontend` — Next.js (port 3000, HMR enabled)
- `nginx` — Reverse proxy (port 80)

**Setup:**
1. Create `docker/.env` with DB credentials
2. Run `make up` to start all services
3. Access via http://localhost

**Logs:** `make logs` (tail all containers)

## Performance & Scalability

### Current Implementation
- Single filesystem backend at `backend/uploads/`
- Nginx reverse proxy with static file caching for `/uploads/` path
- 10 MB body limit for API requests
- Pagination support on list endpoints (default: page 1, limit 10)
- GORM query builder (no raw SQL unless necessary)

### Design for Scaling
- Stateless API design (all state in PostgreSQL)
- JWT authentication (no session storage)
- Repository pattern enables easy database swaps
- Service layer abstracts business logic from data access
- Optional S3 integration via `UploadService` interface in future

## Error Handling

All endpoints return consistent error format:

```json
{
  "status": "error",
  "message": "User-friendly error message",
  "code": "ERROR_CODE"
}
```

**Common Status Codes:**
- 400 Bad Request — Invalid input
- 401 Unauthorized — Missing/invalid JWT
- 403 Forbidden — Insufficient permissions
- 404 Not Found — Resource not found
- 413 Payload Too Large — File exceeds size limit
- 422 Unprocessable Entity — Invalid file type
- 500 Internal Server Error — Server fault

