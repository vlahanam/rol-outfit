---
title: Auth Routes & Full CRUD Implementation
status: completed
priority: high
created: 2026-04-28
completed: 2026-04-28
blockedBy: []
blocks: []
---

# Auth Routes & Full CRUD Implementation

Hoàn thiện luồng authentication (đăng ký/đăng nhập routes chưa được đăng ký) và implement đầy đủ CRUD cho 6 model còn lại từ migrations: categories, products, carts, cart_item, orders, order_item.

## Luồng Authentication Hiện Tại

```
POST /api/v1/auth/register | /api/v1/auth/login
  → Controller (parse + validate request)
  → repositories.NewPostgreSQLStorage(db)     ← *postgreStorage implements all repo interfaces
  → services.NewAuthService(repo, jwtSecret)
  → Service (business logic: bcrypt hash, email uniqueness check)
  → UserRepository (GORM queries)
  → Return: AuthTokens{access_token (24h HS256), refresh_token (7d HS256)}
```

**Vấn đề cần sửa ngay**:
- Auth routes CHƯA được đăng ký trong `initialize/route.go` (chỉ có TODO comment)
- `AppConfig` CHƯA có `JWTSecret` field
- Chưa có JWT middleware để bảo vệ routes
- Chưa có RBAC middleware (admin vs customer)

## Phases

| # | Phase | Status | Est. Effort |
|---|-------|--------|-------------|
| 1 | [Auth Routes & JWT Middleware](./phase-01-auth-routes-jwt.md) | completed | 30 min |
| 2 | [Data Models](./phase-02-data-models.md) | completed | 20 min |
| 3 | [Repositories](./phase-03-repositories.md) | completed | 40 min |
| 4 | [Category & Product](./phase-04-category-product-crud.md) | completed | 60 min |
| 5 | [Cart](./phase-05-cart-crud.md) | completed | 40 min |
| 6 | [Order](./phase-06-order-crud.md) | completed | 50 min |

## Architecture Pattern (existing, must follow)

```
Request → Controller → Service → Repository → DB
models/     → GORM structs, TableName()
repositories/ → interfaces + methods on *postgreStorage
services/     → business logic interfaces + implementations
controllers/  → functional fiber.Handler factories (not struct methods)
requests/     → ozzo-validation request structs
dto/          → response DTOs with MapXxx[T] generic helpers
initialize/   → app setup (route.go, loadconfig.go, postgres.go, run.go)
middleware/   → JWT + RBAC (NEW)
common/       → shared error/response utilities
i18n/         → vi.json / ja.json translations
```

## Route Map

```
POST   /api/v1/auth/register             public
POST   /api/v1/auth/login                public

GET    /api/v1/categories                public
GET    /api/v1/categories/:id            public
POST   /api/v1/categories                admin
PUT    /api/v1/categories/:id            admin
DELETE /api/v1/categories/:id            admin

GET    /api/v1/products                  public
GET    /api/v1/products/:id              public
POST   /api/v1/products                  admin
PUT    /api/v1/products/:id              admin
DELETE /api/v1/products/:id              admin

GET    /api/v1/cart                      user
POST   /api/v1/cart/items                user
PUT    /api/v1/cart/items/:itemID        user
DELETE /api/v1/cart/items/:itemID        user

GET    /api/v1/orders                    user (own) / admin (all)
GET    /api/v1/orders/:id               user (own) / admin (any)
POST   /api/v1/orders                    user
PUT    /api/v1/orders/:id/status         admin
DELETE /api/v1/orders/:id               user (cancel if pending)
```

## Key Files to Create/Modify

**Modify:**
- `backend/src/internal/initialize/loadconfig.go` — add JWTSecret
- `backend/src/internal/initialize/run.go` — pass jwtSecret to InitRoutes
- `backend/src/internal/initialize/route.go` — register all routes
- `backend/src/internal/i18n/locales/vi.json` — add new i18n keys
- `backend/src/internal/i18n/locales/ja.json` — add new i18n keys

**Create:**
- `backend/src/internal/middleware/jwt_middleware.go`
- `backend/src/internal/middleware/role_middleware.go`
- `backend/src/internal/models/category.go`
- `backend/src/internal/models/product.go`
- `backend/src/internal/models/cart.go`
- `backend/src/internal/models/order.go`
- `backend/src/internal/repositories/category_repo.go`
- `backend/src/internal/repositories/product_repo.go`
- `backend/src/internal/repositories/cart_repo.go`
- `backend/src/internal/repositories/order_repo.go`
- `backend/src/internal/services/category_service.go`
- `backend/src/internal/services/product_service.go`
- `backend/src/internal/services/cart_service.go`
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/controllers/category_controller.go`
- `backend/src/internal/controllers/product_controller.go`
- `backend/src/internal/controllers/cart_controller.go`
- `backend/src/internal/controllers/order_controller.go`
- `backend/src/internal/requests/category_request.go`
- `backend/src/internal/requests/product_request.go`
- `backend/src/internal/requests/cart_request.go`
- `backend/src/internal/requests/order_request.go`
- `backend/src/internal/dto/category_dto.go`
- `backend/src/internal/dto/product_dto.go`
- `backend/src/internal/dto/cart_dto.go`
- `backend/src/internal/dto/order_dto.go`
