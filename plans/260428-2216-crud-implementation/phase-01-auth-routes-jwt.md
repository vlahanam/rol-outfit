---
title: Auth Routes & JWT Middleware
status: completed
priority: critical
phase: 1
completed: 2026-04-28
---

# Phase 1: Auth Routes & JWT Middleware

## Overview

Fix auth routes chưa được đăng ký + thêm JWT middleware + RBAC middleware.

## Context Links

- Controller: `backend/src/internal/controllers/auth_controller.go`
- Routes: `backend/src/internal/initialize/route.go`
- Config: `backend/src/internal/initialize/loadconfig.go`
- Run: `backend/src/internal/initialize/run.go`

## Requirements

- Đăng ký auth routes (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`)
- Thêm `JWT_SECRET` vào `AppConfig`
- JWT middleware: parse Bearer token, set `userID` + `role` + `email` vào `ctx.Locals`
- Role middleware: factory trả `fiber.Handler` kiểm tra role từ `ctx.Locals`

## Architecture

```
JWT Middleware flow:
  Authorization: Bearer <token>
  → parse & validate HS256
  → ctx.Locals("userID", claims["sub"])
  → ctx.Locals("role", claims["role"])
  → ctx.Locals("email", claims["email"])
  → Next()

Role Middleware:
  RequireRole(models.USER_ROLE_ADMIN) → fiber.Handler
  → read ctx.Locals("role")
  → if mismatch → 403 Forbidden
```

## Related Code Files

**Modify:**
- `backend/src/internal/initialize/loadconfig.go`
- `backend/src/internal/initialize/run.go`
- `backend/src/internal/initialize/route.go`

**Create:**
- `backend/src/internal/middleware/jwt_middleware.go`
- `backend/src/internal/middleware/role_middleware.go`

## Implementation Steps

### 1. loadconfig.go — thêm JWTSecret

```go
type AppConfig struct {
    // ... existing fields ...
    JWTSecret string
}

func LoadConfig() *AppConfig {
    return &AppConfig{
        // ... existing ...
        JWTSecret: getEnv("JWT_SECRET", "change-me-in-production"),
    }
}
```

### 2. run.go — truyền jwtSecret vào InitRoutes

```go
func Run() {
    cfg := LoadConfig()
    RunMigrations(cfg)
    db := InitDB(cfg)
    app := fiber.New()
    InitRoutes(app, db, cfg.JWTSecret)
    // ...
}
```

### 3. middleware/jwt_middleware.go

```go
package middleware

import (
    "strings"
    "github.com/golang-jwt/jwt/v5"
    "github.com/gofiber/fiber/v3"
    "github.com/vlahanam/rol-outfit/src/internal/common"
    "github.com/vlahanam/rol-outfit/src/internal/i18n"
)

func JWTAuth(jwtSecret string) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        auth := ctx.Get("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") {
            return ctx.Status(fiber.StatusUnauthorized).JSON(
                common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
            )
        }
        tokenStr := strings.TrimPrefix(auth, "Bearer ")
        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
            if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrSignatureInvalid
            }
            return []byte(jwtSecret), nil
        })
        if err != nil || !token.Valid {
            return ctx.Status(fiber.StatusUnauthorized).JSON(
                common.ErrUnauthorized.WithReason(i18n.T(lang, "error.invalid_token")),
            )
        }
        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
        }
        ctx.Locals("userID", claims["sub"])
        ctx.Locals("role", claims["role"])
        ctx.Locals("email", claims["email"])
        return ctx.Next()
    }
}
```

### 4. middleware/role_middleware.go

```go
package middleware

import (
    "github.com/gofiber/fiber/v3"
    "github.com/vlahanam/rol-outfit/src/internal/common"
    "github.com/vlahanam/rol-outfit/src/internal/i18n"
)

// RequireRole trả handler kiểm tra role từ ctx.Locals (set bởi JWTAuth).
func RequireRole(requiredRole float64) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        role, ok := ctx.Locals("role").(float64)
        if !ok || role != requiredRole {
            return ctx.Status(fiber.StatusForbidden).JSON(
                common.ErrForbidden.WithReason(i18n.T(lang, "error.forbidden")),
            )
        }
        return ctx.Next()
    }
}
```

> Note: JWT stores numbers as float64 in MapClaims.

### 5. route.go — đăng ký routes

```go
func InitRoutes(app *fiber.App, db *gorm.DB, jwtSecret string) {
    api := app.Group("/api")
    api.Get("/health", ...)

    v1 := api.Group("/v1")

    // Auth (public)
    auth := v1.Group("/auth")
    auth.Post("/register", controllers.Register(db, jwtSecret))
    auth.Post("/login", controllers.Login(db, jwtSecret))
}
```

### 6. i18n — thêm keys mới

Thêm vào `vi.json` và `ja.json`:
```json
"error.missing_token": "Thiếu token xác thực",
"error.invalid_token": "Token không hợp lệ hoặc đã hết hạn",
"error.forbidden": "Bạn không có quyền thực hiện thao tác này"
```

## Todo List

- [x] Thêm `JWTSecret` vào `AppConfig` và `LoadConfig()`
- [x] Cập nhật `Run()` truyền `cfg.JWTSecret` vào `InitRoutes`
- [x] Cập nhật signature `InitRoutes(app, db, jwtSecret string)`
- [x] Tạo `middleware/jwt_middleware.go`
- [x] Tạo `middleware/role_middleware.go`
- [x] Đăng ký auth routes trong `route.go`
- [x] Thêm i18n keys vào `vi.json` và `ja.json`
- [x] Compile check: `cd backend && go build ./...`

## Success Criteria

- `go build ./...` passes without errors
- `POST /api/v1/auth/register` và `/login` hoạt động
- Protected route với `JWTAuth` middleware trả 401 khi thiếu/sai token
- Admin-only route trả 403 khi role != 1

## Security Considerations

- JWT_SECRET phải đủ dài (>= 32 chars) và không commit vào git
- Token không được log ra console
- Refresh token chưa có revocation (acceptable for MVP)
