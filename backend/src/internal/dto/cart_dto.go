package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type CartItemDTO struct {
	ID         string  `json:"id"`
	ProductID  string  `json:"product_id"`
	AttrID     string  `json:"attr_id,omitempty"`
	PriceAtAdd float64 `json:"price_at_add"`
	Quantity   int     `json:"quantity"`
}

type CartDTO struct {
	ID        string         `json:"id"`
	UserID    string         `json:"user_id"`
	Items     []*CartItemDTO `json:"items"`
	CreatedAt string         `json:"created_at"`
}

func ToCartItemDTO(item *models.CartItem) *CartItemDTO {
	return &CartItemDTO{
		ID:         item.ID,
		ProductID:  item.ProductID,
		AttrID:     item.AttrID,
		PriceAtAdd: item.PriceAtAdd,
		Quantity:   item.Quantity,
	}
}

func ToCartDTO(cart *models.Cart, items []*models.CartItem) *CartDTO {
	dtoItems := make([]*CartItemDTO, 0, len(items))
	for _, item := range items {
		dtoItems = append(dtoItems, ToCartItemDTO(item))
	}
	return &CartDTO{
		ID:        cart.ID,
		UserID:    cart.UserID,
		Items:     dtoItems,
		CreatedAt: cart.CreatedAt.Format(time.RFC3339),
	}
}
