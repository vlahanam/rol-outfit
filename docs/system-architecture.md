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
- `users` — Authentication and profiles
- `categories` — Product categories with slugs
- `products` — Product catalog with `avatar` column (migration 000008)
- `cart_items` — User shopping carts
- `orders` — Order history
- `order_items` — Order line items

### File Storage

**Location:** `backend/uploads/` (Docker volume)

**Behavior:**
- Files stored with UUID + extension (e.g., `a1b2c3d4-e5f6.jpg`)
- Served via Nginx at `/uploads/{filename}` (read-only mount)
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
- Max size: 10 MB (configurable via `UPLOAD_MAX_SIZE`)

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

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/v1/auth/register` | None | - |
| POST | `/api/v1/auth/login` | None | - |

### Products
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| GET | `/api/v1/products` | None | - | List all products |
| GET | `/api/v1/products/:id` | None | - | Get product details |
| POST | `/api/v1/products` | JWT | Admin | Create product |
| PUT | `/api/v1/products/:id` | JWT | Admin | Update product (including avatar) |
| DELETE | `/api/v1/products/:id` | JWT | Admin | Delete product |

### File Upload
| Method | Endpoint | Auth | Role | Notes |
|--------|----------|------|------|-------|
| POST | `/api/v1/uploads` | JWT | User | Upload file, returns URL |
| DELETE | `/api/v1/uploads/:filename` | JWT | Admin | Delete uploaded file |

### Categories, Cart, Orders
See CRUD endpoints for each entity (similar structure to Products).

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

### Current Limitations
- Single filesystem backend (no S3/cloud storage)
- No image optimization or CDN
- No caching layer (Redis)
- Database indexing minimal

### Future Improvements
- Image resizing and optimization (ImageMagick/ffmpeg)
- S3 or cloud blob storage integration
- Redis caching for products and cart
- Database indexing on frequently queried fields
- Async job queue for heavy operations

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

