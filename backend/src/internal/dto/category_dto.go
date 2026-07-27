package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/utils"
)

type CategoryDTO struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	NameJa        string `json:"name_ja,omitempty"`
	Slug          string `json:"slug"`
	Status        int8   `json:"status"`
	Description   string `json:"description"`
	DescriptionJa string `json:"description_ja,omitempty"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func ToCategoryDTO(c *models.Category) *CategoryDTO {
	return &CategoryDTO{
		ID:            c.ID,
		Name:          c.Name,
		NameJa:        c.NameJa,
		Slug:          c.Slug,
		Status:        c.Status,
		Description:   c.Description,
		DescriptionJa: c.DescriptionJa,
		CreatedAt:   c.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Format(time.RFC3339),
	}
}

func MapCategory[T any](c *models.Category, mapper func(*models.Category) T) T {
	return mapper(c)
}

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
