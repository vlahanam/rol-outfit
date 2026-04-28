package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

const (
	PRODUCT_STATUS_ACTIVE = int8(1)
	PRODUCT_STATUS_HIDDEN = int8(2)
)

type Product struct {
	ID           string          `gorm:"type:uuid;primaryKey"`
	CategoryID   string          `gorm:"column:category_id;type:uuid"`
	Name         string          `gorm:"column:name"`
	Slug         string          `gorm:"column:slug"`
	DefaultPrice float64         `gorm:"column:default_price;type:numeric(12,2)"`
	Description  string          `gorm:"column:description"`
	Status       int8            `gorm:"column:status"`
	Data         json.RawMessage `gorm:"column:data;type:jsonb"`
	CreatedAt    time.Time       `gorm:"column:created_at"`
	UpdatedAt    time.Time       `gorm:"column:updated_at"`
	DeletedAt    gorm.DeletedAt  `gorm:"column:deleted_at;index"`
}

func (Product) TableName() string { return "products" }
