package models

import "time"

type Cart struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"column:user_id;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (Cart) TableName() string { return "carts" }

type CartItem struct {
	ID         string    `gorm:"type:uuid;primaryKey"`
	CartID     string    `gorm:"column:cart_id;type:uuid"`
	ProductID  string    `gorm:"column:product_id;type:uuid"`
	AttrID     *string   `gorm:"column:attr_id;type:uuid"`
	PriceAtAdd float64   `gorm:"column:price_at_add;type:numeric(12,2)"`
	Quantity   int       `gorm:"column:quantity"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}

func (CartItem) TableName() string { return "cart_item" }
