---
title: Product Avatar & File Upload/Delete
status: completed
priority: high
created: 2026-04-28
blockedBy: []
blocks: []
---

# Product Avatar & File Upload/Delete

Thêm field `avatar` (nullable TEXT) vào bảng `products`, và implement tính năng upload/xóa file ảnh — lưu local filesystem, serve qua Nginx static.

## Storage Strategy

```
Client → POST /api/v1/uploads (multipart/form-data)
       ← { url: "/uploads/<uuid>.<ext>" }

Nginx static: /uploads/* → ./backend/uploads/
File naming:  <uuid>.<ext>  (no original filename kept)
Allowed types: image/jpeg, image/png, image/webp, image/gif
Max size: 10MB (configurable via UPLOAD_MAX_SIZE env)
```

Avatar trong product là URL string (lưu đường dẫn tương đối `/uploads/...`). Không auto-delete file cũ khi update avatar — frontend/admin phải gọi DELETE riêng.

## Phases

| # | Phase | Status | Est. Effort |
|---|-------|--------|-------------|
| 1 | [DB Migration — products.avatar](./phase-01-migration-avatar.md) | done | 10 min |
| 2 | [Product Model + DTO + Request Update](./phase-02-product-avatar.md) | done | 15 min |
| 3 | [File Upload/Delete Feature](./phase-03-file-upload.md) | done | 30 min |

## Files to Create/Modify

**Create:**
- `backend/database/migrations/000008_add_products_avatar.up.sql`
- `backend/database/migrations/000008_add_products_avatar.down.sql`
- `backend/src/internal/services/upload_service.go`
- `backend/src/internal/controllers/upload_controller.go`

**Modify:**
- `backend/src/internal/models/product.go` — add Avatar field
- `backend/src/internal/dto/product_dto.go` — add Avatar to DTO
- `backend/src/internal/requests/product_request.go` — add Avatar *string
- `backend/src/internal/services/product_service.go` — handle avatar in Create/Update
- `backend/src/internal/initialize/loadconfig.go` — add UploadDir, UploadURL, UploadMaxSize
- `backend/src/internal/initialize/route.go` — register upload routes
- `nginx/conf.d/default.conf` — add /uploads/ static location
- `docker/docker-compose.yml` — add uploads volume bind mount

## Route Map

```
POST   /api/v1/uploads          [JWT auth]  — upload file, return { url }
DELETE /api/v1/uploads/:filename [admin]     — delete file by name
```
