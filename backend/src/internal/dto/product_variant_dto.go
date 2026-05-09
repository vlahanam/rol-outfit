package dto

import (
	"encoding/json"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type ProductVariantDTO struct {
	ID              string          `json:"id"`
	ProductID       string          `json:"product_id"`
	Attributes      json.RawMessage `json:"attributes"`
	Price           float64         `json:"price"`
	Stock           int             `json:"stock"`
	Sold            int             `json:"sold"`
	Avatar          string          `json:"avatar,omitempty"`
	Status          int8            `json:"status"`
	DiscountPercent float64         `json:"discount_percent"`
	DiscountStartAt string          `json:"discount_start_at,omitempty"`
	DiscountEndAt   string          `json:"discount_end_at,omitempty"`
	SalePrice       float64         `json:"sale_price"`
	CreatedAt       string          `json:"created_at"`
	UpdatedAt       string          `json:"updated_at"`
}

// ToVariantDTOWithProduct computes effective price with product-level discount as fallback.
func ToVariantDTOWithProduct(v *models.ProductVariant, p *models.Product) *ProductVariantDTO {
	salePrice := v.Price
	if IsDiscountActive(v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt) {
		salePrice = EffectivePrice(v.Price, v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt)
	} else if p != nil && IsDiscountActive(p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt) {
		salePrice = EffectivePrice(v.Price, p.DiscountPercent, p.DiscountStartAt, p.DiscountEndAt)
	}
	return &ProductVariantDTO{
		ID:              v.ID,
		ProductID:       v.ProductID,
		Attributes:      v.Attributes,
		Price:           v.Price,
		Stock:           v.Stock,
		Sold:            v.Sold,
		Avatar:          v.Avatar,
		Status:          v.Status,
		DiscountPercent: v.DiscountPercent,
		DiscountStartAt: formatTimePtr(v.DiscountStartAt),
		DiscountEndAt:   formatTimePtr(v.DiscountEndAt),
		SalePrice:       salePrice,
		CreatedAt:       v.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       v.UpdatedAt.Format(time.RFC3339),
	}
}

func ToVariantDTO(v *models.ProductVariant) *ProductVariantDTO {
	return ToVariantDTOWithProduct(v, nil)
}
