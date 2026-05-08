---
phase: 01
title: Backend — Admin Category Endpoints
status: todo
priority: high
---

# Phase 01 — Backend: Admin Category Endpoints

## Context Links

- Controller: `backend/src/internal/controllers/category_controller.go`
- Repository: `backend/src/internal/repositories/category_repo.go`
- Service: `backend/src/internal/services/category_service.go`
- Routes: `backend/src/internal/initialize/route.go`
- Model: `backend/src/internal/models/category.go`
- Pattern reference: `backend/src/internal/controllers/product_controller.go` (AdminListProducts, AdminGetProduct)

## Overview

- **Priority:** High
- **Status:** Todo
- **Problem:** Existing `FindCategoryByID` and `ListCategories` filter `status = active`, blocking admin management of hidden categories. No admin-specific routes exist.

## Key Insights

- `category_service.go:Update` and `Delete` call `FindCategoryByID` which has `status = CATEGORY_STATUS_ACTIVE` constraint → admins can't edit/delete hidden categories.
- Products solved this with `/api/v1/admin/products` endpoints backed by separate admin repo methods — same pattern needed here.
- `FindCategoryBySlug` (used in Create/Update slug-collision check) does NOT filter by status — correct behavior.

## Requirements

- Admin can list ALL categories (active + hidden, not deleted)
- Admin can get ANY non-deleted category by ID
- Update and Delete work on any non-deleted category regardless of status
- No changes to public endpoints (`GET /api/v1/categories`, `GET /api/v1/categories/:id`)

## Architecture

```
GET  /api/v1/admin/categories       → AdminListCategories  [admin JWT]
GET  /api/v1/admin/categories/:id   → AdminGetCategory     [admin JWT]
```

Existing admin-protected mutation routes stay:
```
POST   /api/v1/categories     [admin] — unchanged
PUT    /api/v1/categories/:id [admin] — fix: use admin repo method
DELETE /api/v1/categories/:id [admin] — fix: use admin repo method
```

## Related Code Files

**Modify:**
- `backend/src/internal/repositories/category_repo.go`
- `backend/src/internal/services/category_service.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/initialize/route.go`

## Implementation Steps

### Step 1 — Add admin repo methods to `category_repo.go`

Add to `CategoryRepository` interface:
```go
FindCategoryByIDAdmin(ctx context.Context, id string) (*models.Category, error)
ListCategoriesAdmin(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
```

Implement `FindCategoryByIDAdmin` — same as `FindCategoryByID` but **without** `status = ?` filter:
```go
func (r *postgreStorage) FindCategoryByIDAdmin(ctx context.Context, id string) (*models.Category, error) {
    var c models.Category
    err := r.db.WithContext(ctx).
        Where("id = ? AND deleted_at IS NULL", id).
        First(&c).Error
    // same error handling as FindCategoryByID
}
```

Implement `ListCategoriesAdmin` — no status filter, order by `created_at DESC`:
```go
func (r *postgreStorage) ListCategoriesAdmin(ctx context.Context, offset, limit int) ([]*models.Category, int64, error) {
    // same as ListCategories but WHERE clause: "deleted_at IS NULL" only
}
```

### Step 2 — Update `category_service.go`

Add to `CategoryService` interface:
```go
ListAdmin(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
GetByIDAdmin(ctx context.Context, id string) (*models.Category, error)
```

Implement both using the new admin repo methods.

Update `Update` and `Delete` to call `repo.FindCategoryByIDAdmin` instead of `repo.FindCategoryByID`:
```go
func (s *categoryService) Update(ctx context.Context, id string, req *requests.UpdateCategoryRequest) error {
    existing, err := s.repo.FindCategoryByIDAdmin(ctx, id)  // ← changed
    ...
}

func (s *categoryService) Delete(ctx context.Context, id string) error {
    existing, err := s.repo.FindCategoryByIDAdmin(ctx, id)  // ← changed
    ...
}
```

### Step 3 — Add admin controllers to `category_controller.go`

Add `AdminListCategories` and `AdminGetCategory` following the `AdminListProducts`/`AdminGetProduct` pattern in `product_controller.go`.

`AdminListCategories`:
- Bind query paging, call `svc.ListAdmin`, map to `[]*dto.CategoryDTO`, return paginated response.

`AdminGetCategory`:
- Get `:id` param, call `svc.GetByIDAdmin`, return `dto.CategoryDTO`. Return 404 if not found.

### Step 4 — Register admin routes in `route.go`

Add after `adminProductsGroup`:
```go
adminCatsGroup := v1.Group("/admin/categories",
    middleware.JWTAuth(jwtSecret),
    middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
)
adminCatsGroup.Get("/", controllers.AdminListCategories(db))
adminCatsGroup.Get("/:id", controllers.AdminGetCategory(db))
```

### Step 5 — Compile check

```bash
cd backend && go build ./src/cmd/main.go
```

## Todo

- [ ] Add `FindCategoryByIDAdmin` + `ListCategoriesAdmin` to repo interface + implementation
- [ ] Add `ListAdmin` + `GetByIDAdmin` to service interface + implementation
- [ ] Update `Update` and `Delete` service methods to use `FindCategoryByIDAdmin`
- [ ] Add `AdminListCategories` + `AdminGetCategory` controller functions
- [ ] Register `/api/v1/admin/categories` routes in `route.go`
- [ ] Compile and verify no errors

## Success Criteria

- `go build ./src/cmd/main.go` succeeds
- `GET /api/v1/admin/categories` returns all categories (including hidden) with valid admin JWT
- `GET /api/v1/admin/categories/:id` returns any non-deleted category
- `PUT /api/v1/categories/:id` can update a hidden (status=2) category
- `DELETE /api/v1/categories/:id` can delete a hidden category

## Risk Assessment

- **Low**: All changes are additive (new methods, new routes); no existing behavior broken.
- Public endpoints remain untouched.
