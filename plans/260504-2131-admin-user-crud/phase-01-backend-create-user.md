---
phase: 1
title: Backend - CreateUser Admin Endpoint
status: completed
priority: high
completedOn: 2026-05-04
---

# Phase 1: Backend - CreateUser Admin Endpoint

## Overview

Thêm `POST /api/v1/admin/users` cho phép admin tạo user với role và status tùy chọn. Auth service hiện có (`POST /auth/register`) không cho phép set role/status nên cần endpoint riêng.

## Related Files

- `backend/src/internal/models/user.go`
- `backend/src/internal/requests/user_request.go`
- `backend/src/internal/services/user_service.go`
- `backend/src/internal/controllers/user_controller.go`
- `backend/src/internal/initialize/route.go`

## Key Insights

- `UserRepository.Create()` đã tồn tại (dùng bởi auth service) — không cần thêm repo method
- `UserService` interface chưa có `Create` — cần thêm
- `bcrypt` đã có dependency (`golang.org/x/crypto/bcrypt`)
- Status: 1=active, 0=locked (từ seeder); Role: 1=admin, 2=customer (từ models constants)

## Implementation Steps

### 1. Add status constants to `models/user.go`

```go
const USER_STATUS_ACTIVE = int8(1)
const USER_STATUS_LOCKED = int8(0)
```

### 2. Add `CreateAdminUserRequest` to `requests/user_request.go`

```go
type CreateAdminUserRequest struct {
    FullName string  `json:"full_name"`
    Email    string  `json:"email"`
    Password string  `json:"password"`
    Address  string  `json:"address"`
    Phone    string  `json:"phone"`
    Role     *int8   `json:"role"`   // default: USER_ROLE_CUSTOMER
    Status   *int8   `json:"status"` // default: USER_STATUS_ACTIVE
}

func (r CreateAdminUserRequest) Validate() error { ... }
```

Validation rules:
- FullName: required, length 2-255
- Email: required, valid email format
- Password: required, length 8-100
- Role: optional (nếu set: 1 hoặc 2)
- Status: optional (nếu set: 0 hoặc 1)

### 3. Add `Create` to `UserService` interface + impl in `services/user_service.go`

```go
// In interface:
Create(ctx context.Context, req *requests.CreateAdminUserRequest) (*models.User, error)

// In implementation:
func (s *userService) Create(ctx context.Context, req *requests.CreateAdminUserRequest) (*models.User, error) {
    // 1. Check email uniqueness
    // 2. bcrypt hash password
    // 3. Set defaults for role/status if nil
    // 4. repo.Create(user)
    // 5. Return created user
}
```

### 4. Add `CreateUser` handler to `controllers/user_controller.go`

```go
// CreateUser POST /api/v1/admin/users [admin]
func CreateUser(db *gorm.DB) fiber.Handler { ... }
```

Returns: `201 Created` with `UserDTO`, or appropriate error.

### 5. Register route in `initialize/route.go`

```go
adminUsers.Post("/", controllers.CreateUser(db))
```

## Todo

- [x] Add `USER_STATUS_ACTIVE`, `USER_STATUS_LOCKED` constants to `models/user.go`
- [x] Add `CreateAdminUserRequest` + `Validate()` to `requests/user_request.go`
- [x] Add `Create` method to `UserService` interface and `userService` impl
- [x] Add `CreateUser` handler to `controllers/user_controller.go`
- [x] Register `adminUsers.Post("/", controllers.CreateUser(db))` in `route.go`
- [x] Run `cd backend && go build ./...` to verify no compile errors

## Success Criteria

- `POST /api/v1/admin/users` returns 201 with UserDTO on valid input
- Returns 409 if email already exists
- Returns 400 with validation details on invalid input
- Role defaults to customer (2), status defaults to active (1) if not provided
- `go build ./...` passes with no errors
