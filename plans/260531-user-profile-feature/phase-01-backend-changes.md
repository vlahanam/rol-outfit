# Phase 1: Backend Changes

**Status:** pending
**Priority:** high
**Effort:** ~1.5 hours

## Overview

Add avatar field to User model and create ChangePassword endpoint.

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/internal/models/user.go` | Add Avatar field |
| `backend/src/internal/dto/user_dto.go` | Add Avatar to UserDTO |
| `backend/src/internal/requests/user_request.go` | Add Avatar to UpdateMeRequest, add ChangePasswordRequest |
| `backend/src/internal/services/user_service.go` | Add ChangePassword method, update UpdateMe |
| `backend/src/internal/controllers/user_controller.go` | Add ChangePassword handler |
| `backend/src/internal/initialize/route.go` | Add PUT /users/me/password route |

## Implementation Steps

### Step 1: Update User Model

```go
// models/user.go
type User struct {
    ID        string         `gorm:"type:uuid;primaryKey"`
    FullName  string         `gorm:"column:full_name"`
    Email     string         `gorm:"column:email"`
    Password  string         `gorm:"column:password"`
    Phone     string         `gorm:"column:phone"`
    Avatar    *string        `gorm:"column:avatar;type:varchar(500)"` // NEW
    Role      int8           `gorm:"column:role"`
    Status    int8           `gorm:"column:status"`
    CreatedAt time.Time      `gorm:"column:created_at"`
    UpdatedAt time.Time      `gorm:"column:updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`
}
```

### Step 2: Update UserDTO

```go
// dto/user_dto.go
type UserDTO struct {
    ID        string  `json:"id"`
    FullName  string  `json:"full_name"`
    Email     string  `json:"email"`
    Phone     string  `json:"phone"`
    Avatar    *string `json:"avatar"` // NEW
    Role      int8    `json:"role"`
    Status    int8    `json:"status"`
    CreatedAt string  `json:"created_at"`
    UpdatedAt string  `json:"updated_at"`
}

func ToUserDTO(u *models.User) *UserDTO {
    return &UserDTO{
        // ... existing fields
        Avatar: u.Avatar, // NEW
    }
}
```

### Step 3: Update Requests

```go
// requests/user_request.go

// UpdateMeRequest - add Avatar
type UpdateMeRequest struct {
    FullName *string `json:"full_name"`
    Phone    *string `json:"phone"`
    Avatar   *string `json:"avatar"` // NEW - validate URL starts with /uploads/
}

func (r UpdateMeRequest) Validate() error {
    // ... existing validation
    if r.Avatar != nil {
        if err := validation.Validate(*r.Avatar,
            validation.Length(0, 500).Error("validation.avatar.length"),
            validation.Match(regexp.MustCompile(`^/uploads/.*$`)).Error("validation.avatar.invalid"),
        ); err != nil {
            return err
        }
    }
    return nil
}

// ChangePasswordRequest - NEW
type ChangePasswordRequest struct {
    CurrentPassword string `json:"current_password"`
    NewPassword     string `json:"new_password"`
}

func (r ChangePasswordRequest) Validate() error {
    return validation.ValidateStruct(&r,
        validation.Field(&r.CurrentPassword,
            validation.Required.Error("validation.current_password.required"),
        ),
        validation.Field(&r.NewPassword,
            validation.Required.Error("validation.new_password.required"),
            validation.Length(8, 100).Error("validation.password.length"),
        ),
    )
}
```

### Step 4: Update User Service

```go
// services/user_service.go

var ErrInvalidPassword = errors.New("invalid password")

func (s *UserService) ChangePassword(ctx context.Context, userID string, req *requests.ChangePasswordRequest) error {
    user, err := s.repo.GetUserByID(ctx, userID)
    if err != nil {
        return ErrUserNotFound
    }
    
    // Verify current password
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
        return ErrInvalidPassword
    }
    
    // Hash new password
    hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    user.Password = string(hashed)
    return s.repo.UpdateUser(ctx, user)
}

// UpdateMe - update to handle Avatar
func (s *UserService) UpdateMe(ctx context.Context, userID string, req *requests.UpdateMeRequest) error {
    user, err := s.repo.GetUserByID(ctx, userID)
    if err != nil {
        return ErrUserNotFound
    }
    
    if req.FullName != nil {
        user.FullName = *req.FullName
    }
    if req.Phone != nil {
        // check phone uniqueness if changed
        if user.Phone != *req.Phone {
            existing, _ := s.repo.GetUserByPhone(ctx, *req.Phone)
            if existing != nil && existing.ID != userID {
                return ErrUserPhoneTaken
            }
        }
        user.Phone = *req.Phone
    }
    if req.Avatar != nil {
        user.Avatar = req.Avatar
    }
    
    return s.repo.UpdateUser(ctx, user)
}
```

### Step 5: Add ChangePassword Controller

```go
// controllers/user_controller.go

// ChangePassword PUT /api/v1/users/me/password
func ChangePassword(db *gorm.DB) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
        userID, ok := ctx.Locals("userID").(string)
        if !ok || userID == "" {
            return ctx.Status(fiber.StatusUnauthorized).JSON(
                common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
            )
        }

        var req requests.ChangePasswordRequest
        if err := ctx.Bind().JSON(&req); err != nil {
            return ctx.Status(fiber.StatusBadRequest).JSON(
                common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
            )
        }
        if err := req.Validate(); err != nil {
            details := common.ParseValidationErrors(err, lang)
            resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
            if details != nil {
                resp = resp.WithDetails(details)
            }
            return ctx.Status(fiber.StatusBadRequest).JSON(resp)
        }

        repo := repositories.NewPostgreSQLStorage(db)
        svc := services.NewUserService(repo)

        if err := svc.ChangePassword(ctx.Context(), userID, &req); err != nil {
            if errors.Is(err, services.ErrUserNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(
                    common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
                )
            }
            if errors.Is(err, services.ErrInvalidPassword) {
                return ctx.Status(fiber.StatusBadRequest).JSON(
                    common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_password")),
                )
            }
            slog.Error("ChangePassword failed", "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.SendStatus(fiber.StatusNoContent)
    }
}
```

### Step 6: Add Route

```go
// initialize/route.go
// In authenticated user routes section:
user.Put("/users/me/password", controllers.ChangePassword(db))
```

### Step 7: Add i18n Keys

```go
// i18n/messages - add keys:
// "error.invalid_password": "Mật khẩu hiện tại không đúng"
// "validation.current_password.required": "Vui lòng nhập mật khẩu hiện tại"
// "validation.avatar.length": "URL ảnh đại diện quá dài"
// "validation.avatar.invalid": "URL ảnh đại diện không hợp lệ"
```

## Todo

- [ ] Add Avatar field to User model
- [ ] Update UserDTO with Avatar
- [ ] Add Avatar to UpdateMeRequest with validation
- [ ] Create ChangePasswordRequest with validation
- [ ] Add ErrInvalidPassword error
- [ ] Implement ChangePassword service method
- [ ] Update UpdateMe to handle Avatar
- [ ] Add ChangePassword controller handler
- [ ] Add PUT /users/me/password route
- [ ] Add i18n error messages
- [ ] Run `go build` to verify compilation
- [ ] Test endpoints with curl/Postman

## Verification

```bash
# Test change password
curl -X PUT http://localhost:8080/api/v1/users/me/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"oldpass","new_password":"newpass123"}'

# Test update avatar
curl -X PUT http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatar":"/uploads/avatars/user123.jpg"}'
```
