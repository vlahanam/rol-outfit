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

## Layer-Specific Guidelines

### Controllers

**Responsibility:** Parse requests, validate, call services, return responses

**Structure:**
```go
func GetProduct(svc services.ProductService) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        id := ctx.Params("id")
        product, err := svc.GetProductByID(ctx.Context(), id)
        if err != nil {
            // Handle error with appropriate status
        }
        return ctx.JSON(fiber.Map{"product": product})
    }
}
```

**Guidelines:**
- Use dependency injection (pass services as parameters)
- Validate request data before calling service
- Handle all service error types with appropriate status codes
- Return DTO/serializable types, never raw models
- Log errors with `slog` package before responding

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
- Use standard `testing` package
- Mock external dependencies
- Test both success and error paths
- Use table-driven tests for multiple scenarios
- Aim for >80% code coverage

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

