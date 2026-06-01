# Phase 2: Backend Models & DTOs

**Status:** todo | **Effort:** 1h | **Priority:** P0

## Overview

Update Go models, DTOs, and request structs to include _ja fields.

## Files to Modify

### Models

**`internal/models/product.go`**
```go
type Product struct {
    // ... existing fields
    Name          string `gorm:"column:name"`
    NameJa        string `gorm:"column:name_ja"`           // ADD
    Description   string `gorm:"column:description"`
    DescriptionJa string `gorm:"column:description_ja"`    // ADD
    // ...
}
```

**`internal/models/product_variant.go`**
```go
type ProductVariant struct {
    // ... existing fields
    Name   string `gorm:"column:name"`      // ADD
    NameJa string `gorm:"column:name_ja"`   // ADD
    // ...
}
```

**`internal/models/category.go`**
```go
type Category struct {
    // ... existing fields
    Name          string `gorm:"column:name"`
    NameJa        string `gorm:"column:name_ja"`           // ADD
    Description   string `gorm:"column:description"`
    DescriptionJa string `gorm:"column:description_ja"`    // ADD
    // ...
}
```

**`internal/models/tag.go`**
```go
type Tag struct {
    // ... existing fields
    Name   string `gorm:"column:name"`
    NameJa string `gorm:"column:name_ja"`   // ADD
    // ...
}
```

**`internal/models/widget.go`**
```go
type Widget struct {
    // ... existing fields
    Name   string `gorm:"column:name"`
    NameJa string `gorm:"column:name_ja"`   // ADD
    // ...
}
```

### DTOs (Response)

Add _ja fields to all response DTOs. Example pattern:

```go
type ProductDTO struct {
    ID            string  `json:"id"`
    Name          string  `json:"name"`
    NameJa        string  `json:"name_ja,omitempty"`
    Description   string  `json:"description"`
    DescriptionJa string  `json:"description_ja,omitempty"`
    // ...
}
```

### Requests (Input)

Add _ja fields to create/update requests. Example pattern:

```go
type CreateProductRequest struct {
    Name          string `json:"name" validate:"required,max=255"`
    NameJa        string `json:"name_ja" validate:"omitempty,max=255"`
    Description   string `json:"description"`
    DescriptionJa string `json:"description_ja"`
    // ...
}
```

## Steps

1. Update 5 model files (product, variant, category, tag, widget)
2. Update corresponding DTO files
3. Update corresponding request files
4. Run `go build ./...` to verify compilation
5. Run `go test ./...` to check existing tests

## Todo

- [ ] Update models/product.go
- [ ] Update models/product_variant.go
- [ ] Update models/category.go
- [ ] Update models/tag.go
- [ ] Update models/widget.go
- [ ] Update dto/product_dto.go
- [ ] Update dto/category_dto.go
- [ ] Update dto/tag_dto.go
- [ ] Update dto/widget_dto.go
- [ ] Update requests/product_request.go
- [ ] Update requests/category_request.go
- [ ] Update requests/tag_request.go
- [ ] Compile check
- [ ] Run tests
