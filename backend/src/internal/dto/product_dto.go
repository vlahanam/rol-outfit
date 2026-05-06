package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type ProductDTO struct {
	ID             string   `json:"id"`
	CategoryID     string   `json:"category_id"`
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	DefaultPrice   float64  `json:"default_price"`
	Description    string   `json:"description"`
	Status         int8     `json:"status"`
	AttributeNames []string `json:"attribute_names"`
	Avatar         string   `json:"avatar,omitempty"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

func ToProductDTO(p *models.Product) *ProductDTO {
	attrNames := []string(p.AttributeNames)
	if attrNames == nil {
		attrNames = []string{}
	}
	return &ProductDTO{
		ID:             p.ID,
		CategoryID:     p.CategoryID,
		Name:           p.Name,
		Slug:           p.Slug,
		DefaultPrice:   p.DefaultPrice,
		Description:    p.Description,
		Status:         p.Status,
		AttributeNames: attrNames,
		Avatar:         p.Avatar,
		CreatedAt:      p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      p.UpdatedAt.Format(time.RFC3339),
	}
}

// ProductWithVariantsDTO is the admin response shape: product data + aggregated stats + variants.
type ProductWithVariantsDTO struct {
	ID             string               `json:"id"`
	CategoryID     string               `json:"category_id"`
	Name           string               `json:"name"`
	Slug           string               `json:"slug"`
	DefaultPrice   float64              `json:"default_price"`
	Description    string               `json:"description"`
	Status         int8                 `json:"status"`
	AttributeNames []string             `json:"attribute_names"`
	Avatar         string               `json:"avatar,omitempty"`
	TotalStock     int                  `json:"total_stock"`
	TotalSold      int                  `json:"total_sold"`
	VariantCount   int                  `json:"variant_count"`
	Variants       []*ProductVariantDTO `json:"variants"`
	CreatedAt      string               `json:"created_at"`
	UpdatedAt      string               `json:"updated_at"`
}

func ToProductWithVariantsDTO(p *models.ProductWithVariants) *ProductWithVariantsDTO {
	attrNames := []string(p.AttributeNames)
	if attrNames == nil {
		attrNames = []string{}
	}

	variants := make([]*ProductVariantDTO, 0, len(p.Variants))
	var totalStock, totalSold int
	for _, v := range p.Variants {
		variants = append(variants, ToVariantDTO(v))
		totalStock += v.Stock
		totalSold += v.Sold
	}

	return &ProductWithVariantsDTO{
		ID:             p.ID,
		CategoryID:     p.CategoryID,
		Name:           p.Name,
		Slug:           p.Slug,
		DefaultPrice:   p.DefaultPrice,
		Description:    p.Description,
		Status:         p.Status,
		AttributeNames: attrNames,
		Avatar:         p.Avatar,
		TotalStock:     totalStock,
		TotalSold:      totalSold,
		VariantCount:   len(p.Variants),
		Variants:       variants,
		CreatedAt:      p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      p.UpdatedAt.Format(time.RFC3339),
	}
}

func MapProduct[T any](p *models.Product, mapper func(*models.Product) T) T {
	return mapper(p)
}
