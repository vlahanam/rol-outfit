package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type CategoryDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Status      int8   `json:"status"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func ToCategoryDTO(c *models.Category) *CategoryDTO {
	return &CategoryDTO{
		ID:          c.ID,
		Name:        c.Name,
		Slug:        c.Slug,
		Status:      c.Status,
		Description: c.Description,
		CreatedAt:   c.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Format(time.RFC3339),
	}
}

func MapCategory[T any](c *models.Category, mapper func(*models.Category) T) T {
	return mapper(c)
}
