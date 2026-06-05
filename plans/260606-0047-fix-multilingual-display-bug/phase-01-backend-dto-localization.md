# Phase 1: Backend DTO Localization

**Status:** completed  
**Effort:** 1h  
**Priority:** high

## Overview

Add localized response structs and `ToLocalized(lang string)` methods to all affected DTOs. Uses existing `utils.GetLocalizedString()` helper.

## Files to Modify

- `backend/src/internal/dto/product_dto.go`
- `backend/src/internal/dto/category_dto.go`
- `backend/src/internal/dto/tag_dto.go`
- `backend/src/internal/dto/widget_dto.go`

## Implementation Steps

### 1. Product DTO (`product_dto.go`)

Add after existing `ProductDTO` struct:

```go
// LocalizedProductDTO is the public response with single localized fields
type LocalizedProductDTO struct {
    ID              string                  `json:"id"`
    CategoryID      string                  `json:"category_id"`
    Name            string                  `json:"name"`
    Slug            string                  `json:"slug"`
    DefaultPrice    float64                 `json:"default_price"`
    Description     string                  `json:"description"`
    Status          int8                    `json:"status"`
    AttributeNames  []string                `json:"attribute_names"`
    Avatar          string                  `json:"avatar,omitempty"`
    DiscountPercent float64                 `json:"discount_percent"`
    DiscountStartAt string                  `json:"discount_start_at,omitempty"`
    DiscountEndAt   string                  `json:"discount_end_at,omitempty"`
    SalePrice       float64                 `json:"sale_price"`
    Tags            []*LocalizedTagDTO      `json:"tags,omitempty"`
    CreatedAt       string                  `json:"created_at"`
    UpdatedAt       string                  `json:"updated_at"`
}

func (p *ProductDTO) ToLocalized(lang string) *LocalizedProductDTO {
    var tags []*LocalizedTagDTO
    if len(p.Tags) > 0 {
        tags = make([]*LocalizedTagDTO, 0, len(p.Tags))
        for _, t := range p.Tags {
            tags = append(tags, t.ToLocalized(lang))
        }
    }
    return &LocalizedProductDTO{
        ID:              p.ID,
        CategoryID:      p.CategoryID,
        Name:            utils.GetLocalizedString(p.Name, p.NameJa, lang),
        Slug:            p.Slug,
        DefaultPrice:    p.DefaultPrice,
        Description:     utils.GetLocalizedString(p.Description, p.DescriptionJa, lang),
        Status:          p.Status,
        AttributeNames:  p.AttributeNames,
        Avatar:          p.Avatar,
        DiscountPercent: p.DiscountPercent,
        DiscountStartAt: p.DiscountStartAt,
        DiscountEndAt:   p.DiscountEndAt,
        SalePrice:       p.SalePrice,
        Tags:            tags,
        CreatedAt:       p.CreatedAt,
        UpdatedAt:       p.UpdatedAt,
    }
}
```

Add import: `"github.com/vlahanam/rol-outfit/src/internal/utils"`

### 2. Category DTO (`category_dto.go`)

```go
type LocalizedCategoryDTO struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Slug        string `json:"slug"`
    Status      int8   `json:"status"`
    Description string `json:"description"`
    CreatedAt   string `json:"created_at"`
    UpdatedAt   string `json:"updated_at"`
}

func (c *CategoryDTO) ToLocalized(lang string) *LocalizedCategoryDTO {
    return &LocalizedCategoryDTO{
        ID:          c.ID,
        Name:        utils.GetLocalizedString(c.Name, c.NameJa, lang),
        Slug:        c.Slug,
        Status:      c.Status,
        Description: utils.GetLocalizedString(c.Description, c.DescriptionJa, lang),
        CreatedAt:   c.CreatedAt,
        UpdatedAt:   c.UpdatedAt,
    }
}
```

### 3. Tag DTO (`tag_dto.go`)

```go
type LocalizedTagDTO struct {
    ID        string  `json:"id"`
    Name      string  `json:"name"`
    Slug      string  `json:"slug"`
    StartAt   *string `json:"start_at"`
    EndAt     *string `json:"end_at"`
    CreatedAt string  `json:"created_at"`
    UpdatedAt string  `json:"updated_at"`
}

func (t *TagDTO) ToLocalized(lang string) *LocalizedTagDTO {
    return &LocalizedTagDTO{
        ID:        t.ID,
        Name:      utils.GetLocalizedString(t.Name, t.NameJa, lang),
        Slug:      t.Slug,
        StartAt:   t.StartAt,
        EndAt:     t.EndAt,
        CreatedAt: t.CreatedAt,
        UpdatedAt: t.UpdatedAt,
    }
}
```

### 4. Widget DTO (`widget_dto.go`)

```go
type LocalizedWidgetDTO struct {
    ID           string          `json:"id"`
    ParentID     *string         `json:"parent_id"`
    Name         string          `json:"name"`
    Type         string          `json:"type"`
    DisplayOrder int             `json:"display_order"`
    Depth        int             `json:"depth"`
    Status       int8            `json:"status"`
    Settings     json.RawMessage `json:"settings"`
    Metadata     json.RawMessage `json:"metadata"`
    CreatedAt    string          `json:"created_at"`
    UpdatedAt    string          `json:"updated_at"`
}

func (w *WidgetDTO) ToLocalized(lang string) *LocalizedWidgetDTO {
    return &LocalizedWidgetDTO{
        ID:           w.ID,
        ParentID:     w.ParentID,
        Name:         utils.GetLocalizedString(w.Name, w.NameJa, lang),
        Type:         w.Type,
        DisplayOrder: w.DisplayOrder,
        Depth:        w.Depth,
        Status:       w.Status,
        Settings:     w.Settings,
        Metadata:     w.Metadata,
        CreatedAt:    w.CreatedAt,
        UpdatedAt:    w.UpdatedAt,
    }
}
```

## TODO

- [ ] Add LocalizedProductDTO struct and ToLocalized method
- [ ] Add LocalizedCategoryDTO struct and ToLocalized method
- [ ] Add LocalizedTagDTO struct and ToLocalized method
- [ ] Add LocalizedWidgetDTO struct and ToLocalized method
- [ ] Add utils import to all files
- [ ] Run `go build ./...` to verify compilation

## Verification

```bash
cd backend && go build ./...
```
