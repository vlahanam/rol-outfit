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
	OrderCode       string          `json:"order_code"`
	UserID          string          `json:"user_id"`
	ShippingAddress string          `json:"shipping_address"`
	Phone           string          `json:"phone"`
	TotalPrice      float64         `json:"total_price"`
	ShippingCost    float64         `json:"shipping_cost"`
	CurrencyType    int8            `json:"currency_type"`
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
	orderCode := ""
	if o.OrderCode != nil {
		orderCode = *o.OrderCode
	}
	return &OrderDTO{
		ID:              o.ID,
		OrderCode:       orderCode,
		UserID:          o.UserID,
		ShippingAddress: o.ShippingAddress,
		Phone:           o.Phone,
		TotalPrice:      o.TotalPrice,
		ShippingCost:    o.ShippingCost,
		CurrencyType:    o.CurrencyType,
		Status:          o.Status,
		Note:            o.Note,
		Items:           dtoItems,
		CreatedAt:       o.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       o.UpdatedAt.Format(time.RFC3339),
	}
}

type AdminOrderDTO struct {
	*OrderDTO
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

func ToAdminOrderDTO(o *models.Order, items []*models.OrderItem, user *models.User) *AdminOrderDTO {
	dto := &AdminOrderDTO{
		OrderDTO: ToOrderDTO(o, items),
	}
	if user != nil {
		dto.UserName = user.FullName
		dto.UserEmail = user.Email
	}
	return dto
}

type OrderStatusHistoryDTO struct {
	ID         string  `json:"id"`
	FromStatus *int8   `json:"from_status,omitempty"`
	ToStatus   int8    `json:"to_status"`
	ChangedBy  *string `json:"changed_by,omitempty"`
	Note       string  `json:"note,omitempty"`
	CreatedAt  string  `json:"created_at"`
}

func ToOrderStatusHistoryDTO(h *models.OrderStatusHistory) *OrderStatusHistoryDTO {
	return &OrderStatusHistoryDTO{
		ID:         h.ID,
		FromStatus: h.FromStatus,
		ToStatus:   h.ToStatus,
		ChangedBy:  h.ChangedBy,
		Note:       h.Note,
		CreatedAt:  h.CreatedAt.Format(time.RFC3339),
	}
}
