# Code Standards & Architecture

Guidelines for writing code in the rol-outfit codebase. Follows Go best practices and Fiber conventions.

## Project Structure

```
backend/
├── src/
│   ├── cmd/
│   │   └── main.go                    # Entry point
│   └── internal/
│       ├── common/                    # Shared utilities (errors, slug)
│       ├── controllers/               # HTTP handlers
│       ├── dto/                       # Request/Response types
│       ├── i18n/                      # Localization (VI, JA)
│       ├── middleware/                # Auth, logging
│       ├── models/                    # GORM entities
│       ├── repositories/              # Database abstraction
│       ├── services/                  # Business logic
│       └── initialize/                # Config & routing
├── go.mod                             # Go module definition
├── go.sum                             # Dependency checksums
├── .air.toml                          # Hot reload config
└── migrations/                        # Database migrations
```

## Go Conventions

### File Naming
- Use **snake_case** for file names (Go ecosystem standard)
- Descriptive names reflecting content purpose
  - ✅ `product_controller.go`, `upload_service.go`
  - ❌ `prod.go`, `svc.go`

### File Size
- Target: Keep files under 200 lines for readability
- Split large files into focused modules
- Example: `product_controller.go` for CRUD, separate for specialized operations

### Package Organization

| Package | Purpose | Example |
|---------|---------|---------|
| `cmd/` | Executable entry points | `main.go` |
| `internal/common/` | Shared utilities | `errors.go`, `slug.go` |
| `controllers/` | HTTP request handlers | `product_controller.go` |
| `services/` | Business logic | `product_service.go` |
| `repositories/` | Database operations | `product_repository.go` |
| `models/` | GORM data models | `product.go` |
| `dto/` | Data transfer objects | `product_dto.go` |
| `middleware/` | Request/response middleware | `jwt_auth.go` |
| `initialize/` | Startup initialization | `loadconfig.go`, `route.go` |

### Naming Conventions

**Functions:**
- Use PascalCase for exported functions
- Use camelCase for unexported functions
- Name after action/purpose: `GetProduct()`, `validateEmail()`

**Variables/Constants:**
- Use camelCase for variables: `productID`, `maxSize`
- Use UPPER_SNAKE for constants: `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`

**Types:**
- Use PascalCase: `Product`, `UploadService`, `ProductRepository`
- Suffix interfaces with name of capability: `interface {}`, `Reader`, `Writer`

**Database Fields (GORM Tags):**
- Use snake_case in database: `user_id`, `created_at`
- GORM auto-handles conversion to/from camelCase Go fields

## Dependency Management

### Adding Dependencies
```bash
cd backend && go get github.com/path/to/package
go mod tidy
```

### Current Key Dependencies
- **Fiber v3** — Web framework (`github.com/gofiber/fiber/v3`)
- **GORM** — ORM (`gorm.io/gorm`, `gorm.io/driver/postgres`)
- **PostgreSQL Driver** — `github.com/lib/pq`
- **Validation** — `github.com/go-ozzo/ozzo-validation/v4`
- **UUID** — `github.com/google/uuid`
- **JWT** — `github.com/golang-jwt/jwt/v5`
- **Decimal** — `github.com/shopspring/decimal`

### Widget System Notes
- **Widget Types** (6 total): HERO_BANNER, CATEGORY_CAROUSEL, PRODUCT_GRID, NEW_ARRIVALS, LIST_IMAGE, COLLECTION_GRID
- **Database Migrations** (25 total): Foundation tables (001-009) → Features (010-025)
- **Fixed Widgets**: 4 seeded widgets via migration 000016 (Banner Slider, Collection, New Arrivals, Trend Hot)
- **Metadata**: JSONB column on widgets table (migration 000015) stores type-specific configs

## Layer-Specific Guidelines

### Controllers (Fiber v3)

**Responsibility:** Parse requests, validate, call services, return responses

**Structure (Fiber v3 Pattern):**
```go
// Factory pattern: controller functions receive dependencies and return fiber.Handler
func GetProduct(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        // Extract request parameters
        id := ctx.Params("id")
        
        // Extract language from header for i18n
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        
        // Initialize services with injected dependency (db)
        repo := repositories.NewPostgreSQLStorage(db)
        svc := services.NewProductService(repo)
        
        // Call service
        product, err := svc.GetProductByID(ctx.Context(), id)
        if err != nil {
            if errors.Is(err, services.ErrNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(
                    common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
                )
            }
            slog.Error("GetProduct failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        
        // Return success response
        return ctx.JSON(common.ResponseData(dto.ToProductDTO(product)))
    }
}
```

**Guidelines:**
- Use factory pattern: `func ControllerName(db *gorm.DB) fiber.Handler`
- Extract language from Accept-Language header for i18n support
- Use `errors.Is()` for specific error handling
- Log errors with `slog` before responding
- Return DTO types via `common.ResponseData()` or `common.SuccessResponse()`
- Return appropriate status codes: 400 (bad input), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error)

**Fiber v3 Context Methods:**
- `ctx.Params(key)` — URL path parameters
- `ctx.Query(key)` — Query string parameters
- `ctx.Bind().JSON(&req)` — Parse JSON body
- `ctx.Get(header)` — Get request header
- `ctx.JSON(value)` — Send JSON response
- `ctx.Status(code).JSON(value)` — Send with custom status
- `ctx.SendStatus(code)` — Send status only (no body)
- `ctx.Locals(key)` — Access middleware-injected values (e.g., userID, role)

### Services

**Responsibility:** Business logic, validation, orchestration

**Structure:**
```go
type ProductService interface {
    CreateProduct(ctx context.Context, req CreateProductRequest) (*ProductDTO, error)
    GetProductByID(ctx context.Context, id string) (*ProductDTO, error)
}

type productService struct {
    repo repositories.ProductRepository
    // other dependencies
}
```

**Guidelines:**
- Define interfaces for all services (for testing/mocking)
- Accept `context.Context` as first parameter
- Use descriptive error returns (don't wrap with generic "failed")
- Validate business rules (e.g., category exists, slug unique)
- Use repositories for all database access
- Never directly access database in services

### Repositories

**Responsibility:** Database operations, GORM queries

**Structure:**
```go
type ProductRepository interface {
    Create(ctx context.Context, product *Product) error
    GetByID(ctx context.Context, id uint) (*Product, error)
    Update(ctx context.Context, product *Product) error
    Delete(ctx context.Context, id uint) error
}

type productRepository struct {
    db *gorm.DB
}
```

**Guidelines:**
- Use GORM query builder, not raw SQL (unless necessary for performance)
- Pass `context.Context` through all DB operations
- Use transactions for multi-step operations
- Return GORM models (not DTOs) from repositories
- Handle GORM errors gracefully (`gorm.ErrRecordNotFound`)

**Multi-Tag Query Pattern Example:**
```go
// Filter products by multiple tags (intersection via IN clause)
func (r *productRepository) ListProducts(ctx context.Context, categoryID string, tagSlugs []string, offset, limit int) ([]*Product, int64, error) {
    db := r.db.WithContext(ctx).Model(&Product{}).
        Where("products.deleted_at IS NULL AND products.status = ?", PRODUCT_STATUS_ACTIVE)
    
    if len(tagSlugs) > 0 {
        now := time.Now()
        db = db.
            Joins("JOIN product_tags ON product_tags.product_id = products.id").
            Joins("JOIN tags ON tags.id = product_tags.tag_id").
            Where("tags.slug IN ?", tagSlugs).                                    // Match any tag
            Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now). // Time-window
            Group("products.id")                                                  // Eliminate duplicates
    }
    // ... count and fetch
}
```

**Key Pattern:** Use `GROUP BY` to deduplicate when joining on junction tables (product_tags)

### Models (GORM)

**Responsibility:** Data structure definition, database schema

**Guidelines:**
- Define all GORM tags: `gorm:"column:..."`, `gorm:"foreignKey:..."`, etc.
- Use appropriate Go types:
  - `uint` for IDs
  - `decimal.Decimal` for prices
  - `time.Time` for timestamps
  - `*string` or `sql.NullString` for nullable text
- Include timestamps: `CreatedAt`, `UpdatedAt` (GORM auto-manages)
- Use pointers for relationships (GORM pattern)

**Example:**
```go
type Product struct {
    ID          uint            `gorm:"primaryKey"`
    Name        string          `gorm:"column:name;not null"`
    Avatar      *string         `gorm:"column:avatar"`  // nullable
    CategoryID  uint            `gorm:"column:category_id;not null"`
    Category    Category        `gorm:"foreignKey:CategoryID"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### DTOs (Data Transfer Objects)

**Responsibility:** API request/response contracts

**Guidelines:**
- Separate types for requests and responses (POST != GET response)
- Use JSON tags with snake_case: `json:"product_name"`
- Include validation tags: `validate:"required,min=3"`
- Never return GORM models directly (expose only needed fields)
- Use `*string` for optional fields

**Example:**
```go
type CreateProductRequest struct {
    Name       string `json:"name" validate:"required,min=3"`
    Avatar     string `json:"avatar"`  // optional
    CategoryID uint   `json:"category_id" validate:"required"`
}

type ProductResponse struct {
    ID     uint   `json:"id"`
    Name   string `json:"name"`
    Avatar string `json:"avatar"`  // empty string if null
}
```

## Error Handling

### Custom Errors

Define in `common/errors.go`:

```go
var (
    ErrInvalidInput       = errors.New("invalid input")
    ErrUnauthorized       = errors.New("unauthorized")
    ErrNotFound           = errors.New("resource not found")
    ErrConflict           = errors.New("resource already exists")
)
```

### Error Propagation

**Pattern:**
```go
result, err := svc.Operation()
if err != nil {
    // Use errors.Is() or errors.As() for specific handling
    if errors.Is(err, services.ErrFileTooBig) {
        return ctx.Status(fiber.StatusRequestEntityTooLarge).JSON(...)
    }
    // Log and return generic error
    slog.Error("Operation failed", "error", err)
    return ctx.Status(fiber.StatusInternalServerError).JSON(...)
}
```

### Wrapping Errors

Use `fmt.Errorf("%w")` for context:

```go
file, err := os.Open(path)
if err != nil {
    return fmt.Errorf("open config: %w", err)  // preserves original error
}
```

## Frontend Standards (Next.js & React)

### Project Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/                    # i18n wrapper route segment
│   │   │   ├── (public)/                # Public pages group
│   │   │   ├── (admin)/                 # Admin dashboard group
│   │   │   └── layout.tsx               # Root layout with i18n provider
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/                       # Admin-specific components
│   │   │   ├── image-uploader.tsx       # Reusable file upload component
│   │   │   └── ...
│   │   ├── common/                      # Shared UI (Header, Footer)
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                       # Centralized API client with typed endpoints
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts                     # Shared type definitions
│   └── ...
├── public/                              # Static assets
└── ...
```

### File Naming & Organization

**Component Files:**
- Use **kebab-case** for file names: `image-uploader.tsx`, `product-card.tsx`
- Use **PascalCase** for exported components: `export default ImageUploader`
- One component per file (unless composing related sub-components)

**Utility & Hook Files:**
- Use kebab-case: `use-product-query.ts`, `format-price.ts`
- Custom hooks start with `use`: `useAuth()`, `useCart()`

**Type Files:**
- Use kebab-case: `user-types.ts`, `api-response-types.ts`
- Or combine in `types/index.ts` for small projects

### TypeScript & Code Style

**Type Definitions:**
- Always define types for API responses before using them
- Use explicit return types on functions: `function getValue(): string { ... }`
- Prefer `interface` for object shapes, `type` for unions/aliases
- Example:
  ```typescript
  interface Product {
    id: number;
    name: string;
    price: number;
  }
  
  type ApiResponse<T> = {
    data: T;
    meta?: { page: number };
  };
  ```

**Naming Conventions:**
- Variables/functions: camelCase — `productId`, `handleSubmit()`
- Constants: UPPER_SNAKE_CASE — `MAX_FILE_SIZE`, `API_BASE_URL`
- Components/Classes: PascalCase — `ProductCard`, `AuthProvider`
- Props interfaces: PascalCase with `Props` suffix — `ProductCardProps`

### React Component Patterns

**Functional Components (Default):**
```typescript
interface ProductCardProps {
  id: number;
  name: string;
  onSelect?: (id: number) => void;
}

export default function ProductCard({ id, name, onSelect }: ProductCardProps) {
  return <div onClick={() => onSelect?.(id)}>{name}</div>;
}
```

**Server vs Client Components:**
- Default to server components in App Router
- Use `"use client"` directive only for interactivity (forms, hooks, context)
- Move client components into `app/(public)/components/` subdirectories

**Custom Hooks (Client-side only):**
```typescript
function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    api.products.get(id).then(setProduct).catch(e => setError(e.message));
  }, [id]);
  
  return { product, error };
}
```

### API Integration (lib/api.ts)

**Pattern:** Centralized, typed API client with namespaced endpoints

```typescript
const api = {
  products: {
    list: async (page?: number) => ApiResponse<Product[]>,
    get: async (id: number) => Product,
    create: async (payload: CreateProductPayload) => Product,
  },
  cart: {
    getItems: async () => CartItem[],
    addItem: async (productId: number, qty: number) => CartItem,
  },
};

// Usage in components:
const [products, setProducts] = useState<Product[]>([]);
const products = await api.products.list(1);
```

**Error Handling:**
- Define custom `ApiError` class in `lib/api.ts`
- Use discriminated unions for type-safe error handling
- Example:
  ```typescript
  try {
    const product = await api.products.get(id);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) { /* handle not found */ }
    }
  }
  ```

### Tailwind CSS & Styling

**Approach:**
- Use Tailwind utility classes (no custom CSS unless necessary)
- Follow responsive design: mobile-first, sm/md/lg breakpoints
- Use CSS variables for project colors (configured in `tailwind.config.ts`)

**Common Patterns:**
```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

// Conditional classes (use clsx or tailwind-merge)
<button className={`px-4 py-2 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>

// Dark mode (if enabled)
<div className="dark:bg-gray-900 dark:text-white">
```

### Form Handling

**Pattern:** Use Zod + React Hook Form for validation & submission

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.auth.login(data);
    } catch (err) {
      // Handle error
    }
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

### Authentication & State Management

**Pattern:** Store JWT in localStorage, pass in Authorization header

- Authentication flow: login → store token → pass to all API requests
- Example in `lib/api.ts`:
  ```typescript
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };
  
  const authHeader = { 'Authorization': `Bearer ${getAuthToken()}` };
  ```

**Context for Global State (if needed):**
- Use React Context for minimal state (auth user, theme)
- Don't over-engineer; prefer props drilling for small apps
- Example:
  ```typescript
  export const AuthContext = createContext<AuthContextType | null>(null);
  
  export function AuthProvider({ children }) {
    const [user, setUser] = useState<User | null>(null);
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
  }
  ```

### Common Components Library

**Expected Reusable Components:**
- `Header` — Navigation bar
- `Footer` — App footer
- `ProductCard` — Product list item
- `DeleteConfirmModal` — Confirmation dialog
- `ImageUploader` — File upload component
- Etc.

Organize in `components/{category}/` with consistent props interfaces.

---

## Testing

### Unit Tests

**Location:** `*_test.go` in same package as code

**Naming:** `Test{FunctionName}` convention

```go
func TestCreateProduct(t *testing.T) {
    // Arrange
    repo := &MockProductRepository{}
    svc := NewProductService(repo)
    
    // Act
    result, err := svc.CreateProduct(context.Background(), validRequest)
    
    // Assert
    if err != nil {
        t.Fatalf("expected nil error, got %v", err)
    }
    if result.ID == 0 {
        t.Error("expected non-zero ID")
    }
}
```

**Guidelines:**
- Use standard `testing` package with `testify/assert` for assertions
- Mock external dependencies using interfaces
- Test both success and error paths
- Use table-driven tests for multiple scenarios
- Aim for >80% code coverage
- Example with testify:
  ```go
  func TestCreateProduct(t *testing.T) {
      repo := &MockProductRepository{}
      svc := NewProductService(repo)
      
      result, err := svc.CreateProduct(context.Background(), validRequest)
      
      assert.NoError(t, err)
      assert.NotNil(t, result)
      assert.Equal(t, result.Name, "Test Product")
  }
  ```

### Running Tests

```bash
cd backend && go test ./...              # All tests
cd backend && go test ./src/.../package  # Single package
cd backend && go test -v ./...           # Verbose output
cd backend && go test -cover ./...       # Coverage report
```

## Code Quality

### Linting

**Tool:** golangci-lint

```bash
cd backend && golangci-lint run
```

**Configuration:** `.golangci.yml` (if present)

### Formatting

Use `gofmt` (built-in):

```bash
cd backend && gofmt -w ./src
```

### Comments

**Export Documentation:**
```go
// GetProductByID retrieves a product by its ID.
// Returns ErrNotFound if product does not exist.
func (s *productService) GetProductByID(ctx context.Context, id uint) (*Product, error) {
```

**Unexported Comments:**
```go
// validatePrice ensures price is positive and within reasonable bounds.
func validatePrice(price decimal.Decimal) error {
```

**Block Comments (for complex logic):**
```go
// Path traversal check: ensure resolved path stays within uploadDir
if !strings.HasPrefix(path, filepath.Clean(s.uploadDir)+string(os.PathSeparator)) {
    return errors.New("invalid filename")
}
```

## Security Guidelines

### Database
- Always use parameterized queries (GORM does this by default)
- Never concatenate strings into SQL queries
- Validate foreign key relationships in service layer

### File Operations
- Validate file MIME type from content (not client headers)
- Use UUID for generated filenames
- Validate file paths to prevent directory traversal
- Enforce size limits at service and HTTP levels

### Authentication
- Use bcrypt for password hashing (Go crypto/bcrypt)
- Store JWT secret in environment (never hardcode)
- Validate JWT on every protected endpoint
- Extract user ID from JWT claims safely (assert type)

### Input Validation
- Validate all user input at controller layer
- Use ozzo-validation for struct validation
- Sanitize string inputs (trim whitespace, check length)
- Reject null bytes in strings

## Documentation Standards

### Function Docstrings
- Always start exported functions with declaration name
- Include return values and errors
- Note any side effects

### File Headers
Not required for standard Go (docstring for package is convention)

### Complex Logic
- Explain "why" not "what" (code shows what)
- Reference issues/specs if applicable

## Database Migrations

**Location:** `backend/migrations/`

**Naming Convention:** `{number}_{description}.sql`

Examples:
- `000001_create_users_table.sql`
- `000008_add_avatar_to_products.sql`

**Guidelines:**
- One schema change per file
- Include both UP and DOWN migrations
- Test migrations in dev environment before commit
- Document breaking changes

## Deployment & Configuration

### Environment Variables

**Backend Loading** (in `initialize/loadconfig.go`):

```go
cfg := &Config{
    DBHost:         getEnv("DB_HOST", "localhost"),
    DBPort:         getEnv("DB_PORT", "5432"),
    JWTSecret:      getEnv("JWT_SECRET", ""),  // REQUIRED in prod
    UploadDir:      getEnv("UPLOAD_DIR", "/app/uploads"),
    UploadURL:      getEnv("UPLOAD_URL", "/uploads"),
    UploadMaxSize:  mustParseInt(getEnv("UPLOAD_MAX_SIZE", "10485760")),  // 10MB
}
```

**Required Variables (Production):**
- `JWT_SECRET` — Secret key for JWT signing
- `DB_PASSWORD` — Database password

**Optional Variables (with defaults):**
- `DB_HOST`, `DB_PORT`, `DB_USER` — Database connection
- `PORT` — Fiber server port (default: 8080)
- `UPLOAD_DIR`, `UPLOAD_URL`, `UPLOAD_MAX_SIZE` — File storage config

## Release Process

1. Update `docs/project-changelog.md` with feature/fix
2. Run full test suite: `go test ./...`
3. Run linter: `golangci-lint run`
4. Create git commit with conventional message: `feat:`, `fix:`, `chore:`
5. Tag release: `git tag v0.1.0`
6. Push to main branch

