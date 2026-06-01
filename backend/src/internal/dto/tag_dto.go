package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
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
