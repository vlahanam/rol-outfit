package dto

import (
	"encoding/json"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type ProductVariantDTO struct {
	ID         string          `json:"id"`
	ProductID  string          `json:"product_id"`
	Attributes json.RawMessage `json:"attributes"`
	Price      float64         `json:"price"`
	Stock      int             `json:"stock"`
	Sold       int             `json:"sold"`
	Avatar     string          `json:"avatar,omitempty"`
	Status     int8            `json:"status"`
	CreatedAt  string          `json:"created_at"`
	UpdatedAt  string          `json:"updated_at"`
}

func ToVariantDTO(v *models.ProductVariant) *ProductVariantDTO {
	return &ProductVariantDTO{
		ID:         v.ID,
		ProductID:  v.ProductID,
		Attributes: v.Attributes,
		Price:      v.Price,
		Stock:      v.Stock,
		Sold:       v.Sold,
		Avatar:     v.Avatar,
		Status:     v.Status,
		CreatedAt:  v.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  v.UpdatedAt.Format(time.RFC3339),
	}
}
