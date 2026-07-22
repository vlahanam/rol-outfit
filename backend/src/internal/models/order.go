package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	ORDER_STATUS_AWAITING_PAYMENT  = int8(1) // Chờ chuyển khoản
	ORDER_STATUS_PAYMENT_SUBMITTED = int8(2) // Đã báo CK
	ORDER_STATUS_CONFIRMED         = int8(3) // Xác nhận thành công
	ORDER_STATUS_SHIPPING          = int8(4) // Đang giao
	ORDER_STATUS_COMPLETED         = int8(5) // Hoàn thành
	ORDER_STATUS_CANCELLED         = int8(6) // Đã hủy
	ORDER_STATUS_REFUND_REQUESTED  = int8(7) // Yêu cầu hoàn tiền
	ORDER_STATUS_REFUNDED          = int8(8) // Đã hoàn tiền
)

var ValidOrderTransitions = map[int8][]int8{
	ORDER_STATUS_AWAITING_PAYMENT:  {ORDER_STATUS_PAYMENT_SUBMITTED, ORDER_STATUS_CANCELLED},
	ORDER_STATUS_PAYMENT_SUBMITTED: {ORDER_STATUS_CONFIRMED, ORDER_STATUS_AWAITING_PAYMENT, ORDER_STATUS_CANCELLED},
	ORDER_STATUS_CONFIRMED:         {ORDER_STATUS_SHIPPING, ORDER_STATUS_CANCELLED},
	ORDER_STATUS_SHIPPING:          {ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED},
	ORDER_STATUS_COMPLETED:         {ORDER_STATUS_REFUND_REQUESTED},
	ORDER_STATUS_CANCELLED:         {ORDER_STATUS_REFUNDED},
	ORDER_STATUS_REFUND_REQUESTED:  {ORDER_STATUS_REFUNDED, ORDER_STATUS_COMPLETED},
}

func IsValidTransition(from, to int8) bool {
	allowed, exists := ValidOrderTransitions[from]
	if !exists {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

type Order struct {
	ID              string         `gorm:"type:uuid;primaryKey"`
	UserID          string         `gorm:"column:user_id;type:uuid"`
	ShippingAddress string         `gorm:"column:shipping_address"`
	PostalCode      string         `gorm:"column:postal_code;size:20"`
	Phone           string         `gorm:"column:phone"`
	TotalPrice      float64        `gorm:"column:total_price;type:numeric(12,2)"`
	ShippingCost    float64        `gorm:"column:shipping_cost;type:numeric(12,2);default:0"`
	CurrencyType    int8           `gorm:"column:currency_type;default:2"`
	Status          int8           `gorm:"column:status"`
	Note            string         `gorm:"column:note"`
	OrderCode       *string        `gorm:"column:order_code;type:varchar(16)"`
	TransferBill    *string        `gorm:"column:transfer_bill;type:text"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
	ID          string    `gorm:"type:uuid;primaryKey"`
	OrderID     string    `gorm:"column:order_id;type:uuid"`
	ProductID   string    `gorm:"column:product_id;type:uuid"`
	ProductName string    `gorm:"column:product_name"`
	VariantName string    `gorm:"column:variant_name"`
	AttrID      *string   `gorm:"column:attr_id;type:uuid"`
	Price       float64   `gorm:"column:price;type:numeric(12,2)"`
	Quantity    int       `gorm:"column:quantity"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (OrderItem) TableName() string { return "order_item" }

type OrderStatusHistory struct {
	ID         string    `gorm:"type:uuid;primaryKey"`
	OrderID    string    `gorm:"column:order_id;type:uuid;not null"`
	FromStatus *int8     `gorm:"column:from_status"`
	ToStatus   int8      `gorm:"column:to_status;not null"`
	ChangedBy  *string   `gorm:"column:changed_by;type:uuid"`
	Note       string    `gorm:"column:note"`
	CreatedAt  time.Time `gorm:"column:created_at"`
}

func (OrderStatusHistory) TableName() string { return "order_status_history" }
