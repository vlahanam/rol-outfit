---
title: Category & Product CRUD
status: completed
priority: high
phase: 4
completed: 2026-04-28
---

# Phase 4: Category & Product CRUD

## Overview

Implement full CRUD endpoints cho Category và Product với services, controllers, requests, DTOs, và route registration.

## Context Links

- Models: `backend/src/internal/models/category.go`, `backend/src/internal/models/product.go`
- Repositories: `backend/src/internal/repositories/category_repo.go`, `backend/src/internal/repositories/product_repo.go`

## Architecture

```
GET    /api/v1/categories          → CategoryController.List()   (public, paginated)
GET    /api/v1/categories/:id      → CategoryController.Get()    (public)
POST   /api/v1/categories          → CategoryController.Create() (admin only, validates slug)
PUT    /api/v1/categories/:id      → CategoryController.Update() (admin only)
DELETE /api/v1/categories/:id      → CategoryController.Delete() (admin only, soft delete)

GET    /api/v1/products            → ProductController.List()    (public, paginated, filter by category)
GET    /api/v1/products/:id        → ProductController.Get()     (public)
POST   /api/v1/products            → ProductController.Create()  (admin only, validates slug)
PUT    /api/v1/products/:id        → ProductController.Update()  (admin only)
DELETE /api/v1/products/:id        → ProductController.Delete()  (admin only, soft delete)
```

## Key Insights

- JWT sub claim contains userID (UUID string) — can be type-asserted from float64
- Status filter on public queries (only status=1 ACTIVE)
- Admin-only routes protected by JWT + role middleware
- Slug validation required for Create/Update operations
- Service layer handles business logic, repository handles DB queries

## Related Code Files

**Create:**
- `backend/src/internal/services/category_service.go`
- `backend/src/internal/services/product_service.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/controllers/product_controller.go`
- `backend/src/internal/requests/category_request.go`
- `backend/src/internal/requests/product_request.go`
- `backend/src/internal/dto/category_dto.go`
- `backend/src/internal/dto/product_dto.go`

**Modify:**
- `backend/src/internal/initialize/route.go` — register category + product routes

## Implementation Steps

### Services (CategoryService + ProductService)

Business logic for validation, filtering, state transitions.

### Controllers (functional handlers returning fiber.Handler)

Parse request body/params → validate → call service → return DTO response.

### Requests (ozzo-validation)

Validation rules for Create/Update payloads (required fields, slug format, etc.).

### DTOs (MapXxx[T] generics)

Response wrappers with mappers from model → DTO.

### Route Registration

Register all public + admin routes in route.go with middleware stack.

## Todo List

- [x] Tạo `services/category_service.go`
- [x] Tạo `services/product_service.go`
- [x] Tạo `controllers/category_controller.go`
- [x] Tạo `controllers/product_controller.go`
- [x] Tạo `requests/category_request.go`
- [x] Tạo `requests/product_request.go`
- [x] Tạo `dto/category_dto.go`
- [x] Tạo `dto/product_dto.go`
- [x] Đăng ký routes trong `route.go`
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- All CRUD endpoints registered and callable
- Public endpoints return only ACTIVE (status=1) categories/products
- Admin endpoints require JWT + admin role
- Pagination works (offset/limit)
- Soft delete works correctly
- Error responses consistent with error handling standards
- No compile errors

## Next Steps

- Phase 5: Cart CRUD
- Phase 6: Order CRUD
