package dto

import (
	"encoding/json"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type WidgetDTO struct {
	ID           string          `json:"id"`
	ParentID     *string         `json:"parent_id"`
	Name         string          `json:"name"`
	NameJa       string          `json:"name_ja,omitempty"`
	Type         string          `json:"type"`
	DisplayOrder int             `json:"display_order"`
	Depth        int             `json:"depth"`
	Status       int8            `json:"status"`
	Settings     json.RawMessage `json:"settings"`
	Metadata     json.RawMessage `json:"metadata"`
	CreatedAt    string          `json:"created_at"`
	UpdatedAt    string          `json:"updated_at"`
}

func ToWidgetDTO(w *models.Widget) *WidgetDTO {
	return &WidgetDTO{
		ID:           w.ID,
		ParentID:     w.ParentID,
		Name:         w.Name,
		NameJa:       w.NameJa,
		Type:         w.Type,
		DisplayOrder: w.DisplayOrder,
		Depth:        w.Depth,
		Status:       w.Status,
		Settings:     w.Settings,
		Metadata:     w.Metadata,
		CreatedAt:    w.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    w.UpdatedAt.Format(time.RFC3339),
	}
}
