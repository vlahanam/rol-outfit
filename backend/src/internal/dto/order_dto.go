package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type OrderItemDTO struct {
	ID        string  `json:"id"`
	ProductID string  `json:"product_id"`
	AttrID    string  `json:"attr_id,omitempty"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
}

type OrderDTO struct {
	ID              string          `json:"id"`
	UserID          string          `json:"user_id"`
	ShippingAddress string          `json:"shipping_address"`
	Phone           string          `json:"phone"`
	TotalPrice      float64         `json:"total_price"`
	Status          int8            `json:"status"`
	Note            string          `json:"note,omitempty"`
	Items           []*OrderItemDTO `json:"items,omitempty"`
	CreatedAt       string          `json:"created_at"`
	UpdatedAt       string          `json:"updated_at"`
}

func ToOrderItemDTO(item *models.OrderItem) *OrderItemDTO {
	attrID := ""
	if item.AttrID != nil {
		attrID = *item.AttrID
	}
	return &OrderItemDTO{
		ID:        item.ID,
		ProductID: item.ProductID,
		AttrID:    attrID,
		Price:     item.Price,
		Quantity:  item.Quantity,
	}
}

func ToOrderDTO(o *models.Order, items []*models.OrderItem) *OrderDTO {
	dtoItems := make([]*OrderItemDTO, 0, len(items))
	for _, item := range items {
		dtoItems = append(dtoItems, ToOrderItemDTO(item))
	}
	return &OrderDTO{
		ID:              o.ID,
		UserID:          o.UserID,
		ShippingAddress: o.ShippingAddress,
		Phone:           o.Phone,
		TotalPrice:      o.TotalPrice,
		Status:          o.Status,
		Note:            o.Note,
		Items:           dtoItems,
		CreatedAt:       o.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       o.UpdatedAt.Format(time.RFC3339),
	}
}
