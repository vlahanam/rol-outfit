---
title: File Upload/Delete Feature
status: done
priority: high
phase: 3
---

# Phase 3: File Upload/Delete Feature

## Overview

Implement `POST /api/v1/uploads` (JWT auth) and `DELETE /api/v1/uploads/:filename` (admin)  
Files stored on local filesystem at `backend/uploads/`, served via Nginx static.

## Context Links

- Service: `backend/src/internal/services/upload_service.go` (create)
- Controller: `backend/src/internal/controllers/upload_controller.go` (create)
- Config: `backend/src/internal/initialize/loadconfig.go`
- Routes: `backend/src/internal/initialize/route.go`
- Nginx: `nginx/conf.d/default.conf`
- Docker: `docker/docker-compose.yml`

## Related Code Files

**Create:**
- `backend/src/internal/services/upload_service.go`
- `backend/src/internal/controllers/upload_controller.go`

**Modify:**
- `backend/src/internal/initialize/loadconfig.go`
- `backend/src/internal/initialize/route.go`
- `nginx/conf.d/default.conf`
- `docker/docker-compose.yml`

## Implementation Steps

### 1. loadconfig.go — add upload config fields

```go
type AppConfig struct {
    // ... existing fields ...
    UploadDir     string  // absolute path where files are stored
    UploadURL     string  // URL prefix returned in response (e.g. "/uploads")
    UploadMaxSize int64   // max file size in bytes
}

// in LoadConfig():
UploadDir:     getEnv("UPLOAD_DIR", "/app/uploads"),
UploadURL:     getEnv("UPLOAD_URL", "/uploads"),
UploadMaxSize: int64(10 * 1024 * 1024), // 10 MB default; parse from UPLOAD_MAX_SIZE if needed
```

> `UPLOAD_MAX_SIZE` can stay hardcoded at 10MB for now — configurable via env is a nice-to-have, not required.

### 2. services/upload_service.go

```go
package services

import (
    "errors"
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "strings"

    "github.com/google/uuid"
)

var (
    ErrFileTooBig       = errors.New("file exceeds maximum allowed size")
    ErrFileTypeNotAllow = errors.New("file type not allowed")
)

var allowedMIME = map[string]string{
    "image/jpeg": ".jpg",
    "image/png":  ".png",
    "image/webp": ".webp",
    "image/gif":  ".gif",
}

type UploadService interface {
    Save(fh *multipart.FileHeader, maxSize int64) (filename string, err error)
    Delete(filename string) error
}

type uploadService struct {
    uploadDir string
    uploadURL string
}

func NewUploadService(uploadDir, uploadURL string) UploadService {
    return &uploadService{uploadDir: uploadDir, uploadURL: uploadURL}
}

func (s *uploadService) Save(fh *multipart.FileHeader, maxSize int64) (string, error) {
    if fh.Size > maxSize {
        return "", ErrFileTooBig
    }

    contentType := fh.Header.Get("Content-Type")
    ext, ok := allowedMIME[contentType]
    if !ok {
        return "", ErrFileTypeNotAllow
    }

    filename := uuid.New().String() + ext
    dst := filepath.Join(s.uploadDir, filename)

    src, err := fh.Open()
    if err != nil {
        return "", fmt.Errorf("open upload: %w", err)
    }
    defer src.Close()

    if err := os.MkdirAll(s.uploadDir, 0o755); err != nil {
        return "", fmt.Errorf("mkdir upload dir: %w", err)
    }

    out, err := os.Create(dst)
    if err != nil {
        return "", fmt.Errorf("create file: %w", err)
    }
    defer out.Close()

    if _, err := io.Copy(out, src); err != nil {
        return "", fmt.Errorf("write file: %w", err)
    }

    return s.uploadURL + "/" + filename, nil
}

func (s *uploadService) Delete(filename string) error {
    // prevent path traversal
    if strings.ContainsAny(filename, "/\\") {
        return errors.New("invalid filename")
    }
    path := filepath.Join(s.uploadDir, filename)
    if err := os.Remove(path); err != nil {
        if os.IsNotExist(err) {
            return ErrFileNotFound
        }
        return fmt.Errorf("delete file: %w", err)
    }
    return nil
}

var ErrFileNotFound = errors.New("file not found")
```

### 3. controllers/upload_controller.go

```go
package controllers

import (
    "errors"
    "log/slog"

    "github.com/gofiber/fiber/v3"
    "github.com/vlahanam/rol-outfit/src/internal/common"
    "github.com/vlahanam/rol-outfit/src/internal/services"
)

// UploadFile POST /api/v1/uploads
func UploadFile(svc services.UploadService, maxSize int64) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        fh, err := ctx.FormFile("file")
        if err != nil {
            return ctx.Status(fiber.StatusBadRequest).JSON(
                common.ErrBadRequest.WithReason("file field is required"),
            )
        }

        url, err := svc.Save(fh, maxSize)
        if err != nil {
            switch {
            case errors.Is(err, services.ErrFileTooBig):
                return ctx.Status(fiber.StatusRequestEntityTooLarge).JSON(
                    common.ErrBadRequest.WithReason("file exceeds maximum size"),
                )
            case errors.Is(err, services.ErrFileTypeNotAllow):
                return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
                    common.ErrBadRequest.WithReason("file type not allowed"),
                )
            default:
                slog.Error("UploadFile failed", "error", err)
                return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
            }
        }

        return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"url": url})
    }
}

// DeleteFile DELETE /api/v1/uploads/:filename
func DeleteFile(svc services.UploadService) fiber.Handler {
    return func(ctx fiber.Ctx) error {
        filename := ctx.Params("filename")
        if err := svc.Delete(filename); err != nil {
            if errors.Is(err, services.ErrFileNotFound) {
                return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
            }
            slog.Error("DeleteFile failed", "filename", filename, "error", err)
            return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
        }
        return ctx.SendStatus(fiber.StatusNoContent)
    }
}
```

### 4. route.go — register upload routes

Add after admin orders group (pass `cfg *AppConfig` to `InitRoutes`, or pass uploadDir/uploadURL/maxSize directly):

```go
// Update signature:
func InitRoutes(app *fiber.App, db *gorm.DB, cfg *initialize.AppConfig) {
    // ... existing code using cfg.JWTSecret ...
    
    uploadSvc := services.NewUploadService(cfg.UploadDir, cfg.UploadURL)

    // Uploads (JWT auth required)
    uploads := v1.Group("/uploads", middleware.JWTAuth(cfg.JWTSecret))
    uploads.Post("/", controllers.UploadFile(uploadSvc, cfg.UploadMaxSize))

    // Delete upload (admin only)
    adminUploads := v1.Group("/uploads",
        middleware.JWTAuth(cfg.JWTSecret),
        middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
    )
    adminUploads.Delete("/:filename", controllers.DeleteFile(uploadSvc))
}
```

> `InitRoutes` signature changes: `(app, db, jwtSecret string)` → `(app, db, cfg)`.  
> Update call site in `run.go` accordingly.

### 5. nginx/conf.d/default.conf — add /uploads/ static location

Add before `location /api/`:

```nginx
location /uploads/ {
    alias /app/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

### 6. docker/docker-compose.yml — add uploads volume

In `backend` service volumes:

```yaml
volumes:
  - ../backend:/app
  - ../backend/uploads:/app/uploads   # add this line
  - go_cache:/go/pkg/mod
```

In `nginx` service volumes:

```yaml
volumes:
  - ../nginx/conf.d:/etc/nginx/conf.d:ro
  - ../backend/uploads:/app/uploads:ro   # add this line
```

> Both backend and nginx need to see the same directory. Backend writes; nginx reads.

### 7. Create uploads directory

```bash
mkdir -p backend/uploads
echo "# uploads dir — files ignored" > backend/uploads/.gitkeep
```

Add to `.gitignore` (or `backend/.gitignore`):
```
uploads/*
!uploads/.gitkeep
```

## Todo List

- [x] Thêm `UploadDir`, `UploadURL`, `UploadMaxSize` vào `AppConfig` và `LoadConfig()`
- [x] Cập nhật `run.go`: truyền `cfg` thay vì `cfg.JWTSecret` vào `InitRoutes`
- [x] Tạo `backend/src/internal/services/upload_service.go`
- [x] Tạo `backend/src/internal/controllers/upload_controller.go`
- [x] Cập nhật `route.go`: thay đổi signature, khởi tạo `uploadSvc`, đăng ký routes
- [x] Thêm `/uploads/` static block vào `nginx/conf.d/default.conf`
- [x] Thêm uploads volume vào backend + nginx trong `docker-compose.yml`
- [x] Tạo `backend/uploads/.gitkeep` và cập nhật `.gitignore`
- [x] Compile check: `cd backend && go build ./src/...`

## Success Criteria

- `go build ./src/...` passes
- `POST /api/v1/uploads` với valid JWT + multipart file → `201 { "url": "/uploads/<uuid>.jpg" }`
- `POST /api/v1/uploads` file > 10MB → `413`
- `POST /api/v1/uploads` non-image MIME → `422`
- `DELETE /api/v1/uploads/:filename` với admin JWT → `204`
- `DELETE /api/v1/uploads/:filename` không tồn tại → `404`
- File được serve qua `GET /uploads/<uuid>.jpg` (Nginx static)

## Risk Assessment

- **Path traversal**: `Delete` sanitizes `filename` — reject any `/` or `\` in filename param
- **MIME spoofing**: Checks `Content-Type` header (set by browser from file extension). Not perfect but acceptable for this use case. Full mitigation would require reading magic bytes.
- **Disk space**: No quota enforcement — acceptable for current scope.
- **Race condition on delete**: Non-issue (single writer per file, delete is atomic on Linux).

## Security Considerations

- Upload requires JWT (any authenticated user)
- Delete requires admin role
- Filename generated server-side (UUID) — no user-controlled path component
- `os.MkdirAll` with `0o755` — appropriate permissions
