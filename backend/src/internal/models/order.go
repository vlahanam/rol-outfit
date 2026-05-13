package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	ORDER_STATUS_PENDING   = int8(1)
	ORDER_STATUS_CONFIRMED = int8(2)
	ORDER_STATUS_SHIPPING  = int8(3)
	ORDER_STATUS_DELIVERED = int8(4)
	ORDER_STATUS_PAID      = int8(5)
	ORDER_STATUS_CANCELLED = int8(6)
)

type Order struct {
	ID              string         `gorm:"type:uuid;primaryKey"`
	UserID          string         `gorm:"column:user_id;type:uuid"`
	ShippingAddress string         `gorm:"column:shipping_address"`
	Phone           string         `gorm:"column:phone"`
	TotalPrice      float64        `gorm:"column:total_price;type:numeric(12,2)"`
	Status          int8           `gorm:"column:status"`
	Note            string         `gorm:"column:note"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	OrderID   string    `gorm:"column:order_id;type:uuid"`
	ProductID string    `gorm:"column:product_id;type:uuid"`
	AttrID    *string   `gorm:"column:attr_id;type:uuid"`
	Price     float64   `gorm:"column:price;type:numeric(12,2)"`
	Quantity  int       `gorm:"column:quantity"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (OrderItem) TableName() string { return "order_item" }
