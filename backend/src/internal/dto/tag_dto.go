package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/utils"
)

type TagDTO struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	NameJa    string  `json:"name_ja,omitempty"`
	Slug      string  `json:"slug"`
	StartAt   *string `json:"start_at"`
	EndAt     *string `json:"end_at"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

func ToTagDTO(t *models.Tag) *TagDTO {
	var startAt, endAt *string
	if t.StartAt != nil {
		s := t.StartAt.Format(time.RFC3339)
		startAt = &s
	}
	if t.EndAt != nil {
		s := t.EndAt.Format(time.RFC3339)
		endAt = &s
	}
	return &TagDTO{
		ID:        t.ID,
		Name:      t.Name,
		NameJa:    t.NameJa,
		Slug:      t.Slug,
		StartAt:   startAt,
		EndAt:     endAt,
		CreatedAt: t.CreatedAt.Format(time.RFC3339),
		UpdatedAt: t.UpdatedAt.Format(time.RFC3339),
	}
}

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
