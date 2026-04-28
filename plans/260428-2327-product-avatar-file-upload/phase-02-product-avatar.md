---
title: Product Model + DTO + Request Update
status: done
priority: high
phase: 2
---

# Phase 2: Product Model + DTO + Request Update

## Overview

Cập nhật model, DTO, request và service để hỗ trợ field `avatar` (nullable string URL).

## Context Links

- Model: `backend/src/internal/models/product.go`
- DTO: `backend/src/internal/dto/product_dto.go`
- Request: `backend/src/internal/requests/product_request.go`
- Service: `backend/src/internal/services/product_service.go`

## Related Code Files

**Modify:**
- `backend/src/internal/models/product.go`
- `backend/src/internal/dto/product_dto.go`
- `backend/src/internal/requests/product_request.go`
- `backend/src/internal/services/product_service.go`

## Implementation Steps

### 1. models/product.go — thêm Avatar field

```go
type Product struct {
    // ... existing fields ...
    Avatar    string          `gorm:"column:avatar"`   // empty string = no avatar
    // ... timestamps ...
}
```

> Dùng `string` (không phải `*string`) — empty string đại diện NULL từ DB (GORM mapping).

### 2. dto/product_dto.go — thêm Avatar vào DTO

```go
type ProductDTO struct {
    // ... existing fields ...
    Avatar    string `json:"avatar,omitempty"`
}

func ToProductDTO(p *models.Product) *ProductDTO {
    return &ProductDTO{
        // ... existing fields ...
        Avatar: p.Avatar,
    }
}
```

### 3. requests/product_request.go — thêm Avatar vào Create/Update

```go
type CreateProductRequest struct {
    // ... existing fields ...
    Avatar string `json:"avatar"`
}

type UpdateProductRequest struct {
    // ... existing fields ...
    Avatar *string `json:"avatar"`   // nil = không thay đổi, "" = xóa avatar
}
```

Không cần validation đặc biệt cho Avatar — chỉ là URL string do client tự cung cấp sau khi upload.

### 4. services/product_service.go — handle Avatar trong Create/Update

**Create:** thêm `Avatar: req.Avatar` khi khởi tạo `&models.Product{}`

**Update:** trong `fields` map:
```go
if req.Avatar != nil {
    fields["avatar"] = *req.Avatar
}
```

## Todo List

- [x] Thêm `Avatar string` vào `models/product.go`
- [x] Thêm `Avatar` vào `ProductDTO` và `ToProductDTO()`
- [x] Thêm `Avatar` vào `CreateProductRequest` và `UpdateProductRequest`
- [x] Xử lý `Avatar` trong `productService.Create()` và `productService.Update()`
- [x] Compile check: `go build ./src/...`

## Success Criteria

- `go build ./src/...` passes
- `GET /api/v1/products/:id` trả về `"avatar": "..."` hoặc omit nếu trống
- `PUT /api/v1/products/:id` với `{"avatar": "/uploads/xyz.jpg"}` cập nhật được
- `PUT /api/v1/products/:id` với `{"avatar": ""}` xóa avatar (set empty)
