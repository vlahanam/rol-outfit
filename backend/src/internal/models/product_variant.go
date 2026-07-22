package models

import (
	"encoding/json"
	"time"
)

const (
	VARIANT_STATUS_ACTIVE = int8(1)
	VARIANT_STATUS_HIDDEN = int8(2)
)

type ProductVariant struct {
	ID              string          `gorm:"type:uuid;primaryKey"`
	ProductID       string          `gorm:"column:product_id;type:uuid"`
	Name            string          `gorm:"column:name"`
	NameJa          string          `gorm:"column:name_ja"`
	Attributes      json.RawMessage `gorm:"column:attributes;type:jsonb"`
	Price           float64         `gorm:"column:price;type:numeric(12,2)"`
	Stock           int             `gorm:"column:stock"`
	Sold            int             `gorm:"column:sold"`
	Avatar          string          `gorm:"column:avatar"`
	Status          int8            `gorm:"column:status"`
	DiscountPercent float64         `gorm:"column:discount_percent;type:numeric(5,2)"`
	DiscountStartAt *time.Time      `gorm:"column:discount_start_at"`
	DiscountEndAt   *time.Time      `gorm:"column:discount_end_at"`
	CreatedAt       time.Time       `gorm:"column:created_at"`
	UpdatedAt       time.Time       `gorm:"column:updated_at"`
}

func (ProductVariant) TableName() string { return "product_variants" }
