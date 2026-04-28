---
title: Category & Product CRUD
status: todo
priority: high
phase: 4
---

# Phase 4: Category & Product CRUD

## Overview

DTOs, requests, services, controllers cho Category và Product. Public read, admin write.

## Context Links

- Pattern service: `backend/src/internal/services/auth_service.go`
- Pattern controller: `backend/src/internal/controllers/auth_controller.go`
- Pattern DTO: `backend/src/internal/dto/user_dto.go`
- Pattern request: `backend/src/internal/requests/auth_request.go`
- Route: `backend/src/internal/initialize/route.go`

## Slug Generation

Thêm helper `slugify(name string) string` trong `common/` hoặc trong service:
```go
import "golang.org/x/text/unicode/norm"
// lowercase → normalize unicode → replace space/special with "-" → trim hyphens
```
Đơn giản nhất: `strings.ToLower` + regexp `[^a-z0-9]+` → `-`.

## Related Code Files

**Create:**
- `backend/src/internal/dto/category_dto.go`
- `backend/src/internal/dto/product_dto.go`
- `backend/src/internal/requests/category_request.go`
- `backend/src/internal/requests/product_request.go`
- `backend/src/internal/services/category_service.go`
- `backend/src/internal/services/product_service.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/controllers/product_controller.go`

**Modify:**
- `backend/src/internal/initialize/route.go` — thêm category + product routes
- `backend/src/internal/i18n/locales/vi.json` — thêm keys
- `backend/src/internal/i18n/locales/ja.json` — thêm keys

## DTOs

### category_dto.go
```go
type CategoryDTO struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Slug        string `json:"slug"`
    Status      int8   `json:"status"`
    Description string `json:"description"`
    CreatedAt   string `json:"created_at"`
}

func ToCategoryDTO(c *models.Category) *CategoryDTO { ... }
func MapCategory[T any](c *models.Category, mapper func(*models.Category) T) T { return mapper(c) }
```

### product_dto.go
```go
type ProductDTO struct {
    ID           string          `json:"id"`
    CategoryID   string          `json:"category_id"`
    Name         string          `json:"name"`
    Slug         string          `json:"slug"`
    DefaultPrice float64         `json:"default_price"`
    Description  string          `json:"description"`
    Status       int8            `json:"status"`
    Data         json.RawMessage `json:"data,omitempty"`
    CreatedAt    string          `json:"created_at"`
}

func ToProductDTO(p *models.Product) *ProductDTO { ... }
```

## Requests

### category_request.go
```go
type CreateCategoryRequest struct {
    Name        string `json:"name"`
    Description string `json:"description"`
}
func (r CreateCategoryRequest) Validate() error { /* name required, length 2-100 */ }

type UpdateCategoryRequest struct {
    Name        *string `json:"name"`
    Description *string `json:"description"`
    Status      *int8   `json:"status"`
}
func (r UpdateCategoryRequest) Validate() error { /* at least one field required */ }
```

### product_request.go
```go
type CreateProductRequest struct {
    CategoryID   string          `json:"category_id"`
    Name         string          `json:"name"`
    DefaultPrice float64         `json:"default_price"`
    Description  string          `json:"description"`
    Data         json.RawMessage `json:"data"`
}
func (r CreateProductRequest) Validate() error { /* name, category_id required; price >= 0 */ }

type UpdateProductRequest struct {
    CategoryID   *string         `json:"category_id"`
    Name         *string         `json:"name"`
    DefaultPrice *float64        `json:"default_price"`
    Description  *string         `json:"description"`
    Status       *int8           `json:"status"`
    Data         json.RawMessage `json:"data"`
}
```

## Services

### category_service.go
```go
var ErrCategoryNotFound  = errors.New("category not found")
var ErrCategorySlugTaken = errors.New("category slug already exists")

type CategoryService interface {
    List(ctx, offset, limit int) ([]*models.Category, int64, error)
    GetByID(ctx, id string) (*models.Category, error)
    GetBySlug(ctx, slug string) (*models.Category, error)
    Create(ctx, req *CreateCategoryRequest) (*models.Category, error)
    Update(ctx, id string, req *UpdateCategoryRequest) error
    Delete(ctx, id string) error
}
```

Create: slugify(name) → check uniqueness → `uuid.New().String()` for ID → CreateCategory.

### product_service.go
```go
var ErrProductNotFound  = errors.New("product not found")
var ErrProductSlugTaken = errors.New("product slug already exists")

type ProductService interface {
    List(ctx, categoryID string, offset, limit int) ([]*models.Product, int64, error)
    GetByID(ctx, id string) (*models.Product, error)
    GetBySlug(ctx, slug string) (*models.Product, error)
    Create(ctx, req *CreateProductRequest) (*models.Product, error)
    Update(ctx, id string, req *UpdateProductRequest) error
    Delete(ctx, id string) error
}
```

## Controllers & Routes

### Endpoints

```
GET    /api/v1/categories          → ListCategories(db)
GET    /api/v1/categories/:id      → GetCategory(db)
POST   /api/v1/categories          → CreateCategory(db) [JWTAuth + RequireRole(admin)]
PUT    /api/v1/categories/:id      → UpdateCategory(db) [JWTAuth + RequireRole(admin)]
DELETE /api/v1/categories/:id      → DeleteCategory(db) [JWTAuth + RequireRole(admin)]

GET    /api/v1/products            → ListProducts(db)    query: ?category_id=&page=&limit=
GET    /api/v1/products/:id        → GetProduct(db)
POST   /api/v1/products            → CreateProduct(db) [JWTAuth + RequireRole(admin)]
PUT    /api/v1/products/:id        → UpdateProduct(db) [JWTAuth + RequireRole(admin)]
DELETE /api/v1/products/:id        → DeleteProduct(db) [JWTAuth + RequireRole(admin)]
```

### route.go pattern (partial)

```go
// Categories
cats := v1.Group("/categories")
cats.Get("/", controllers.ListCategories(db))
cats.Get("/:id", controllers.GetCategory(db))
adminCats := cats.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
adminCats.Post("/", controllers.CreateCategory(db))
adminCats.Put("/:id", controllers.UpdateCategory(db))
adminCats.Delete("/:id", controllers.DeleteCategory(db))
```

### Pagination — dùng common.Paging

```go
var p common.Paging
ctx.Bind().Query(&p)
p.Process()
offset := (p.Page - 1) * p.Limit
```

## i18n Keys cần thêm

```json
"error.category_not_found": "Danh mục không tồn tại",
"error.category_slug_taken": "Đường dẫn danh mục đã được sử dụng",
"error.product_not_found": "Sản phẩm không tồn tại",
"error.product_slug_taken": "Đường dẫn sản phẩm đã được sử dụng",
"validation.name.required": "Tên không được để trống",
"validation.name.length": "Tên phải từ 2 đến 255 ký tự",
"validation.category_id.required": "Danh mục không được để trống",
"validation.price.invalid": "Giá sản phẩm không hợp lệ"
```

## Todo List

- [ ] Tạo `dto/category_dto.go`
- [ ] Tạo `dto/product_dto.go`
- [ ] Tạo `requests/category_request.go`
- [ ] Tạo `requests/product_request.go`
- [ ] Tạo `services/category_service.go`
- [ ] Tạo `services/product_service.go`
- [ ] Tạo `controllers/category_controller.go` (5 handlers)
- [ ] Tạo `controllers/product_controller.go` (5 handlers)
- [ ] Cập nhật `initialize/route.go` — đăng ký category + product routes
- [ ] Thêm i18n keys vào `vi.json` + `ja.json`
- [ ] Compile check: `cd backend && go build ./...`

## Success Criteria

- `go build ./...` passes
- GET /api/v1/categories trả danh sách phân trang
- POST /api/v1/categories với non-admin token trả 403
- POST /api/v1/categories với admin token tạo được category, slug tự sinh
- Slug collision trả 409 Conflict
