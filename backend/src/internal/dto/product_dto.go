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

func MapProduct[T any](p *models.Product, mapper func(*models.Product) T) T {
	return mapper(p)
}
