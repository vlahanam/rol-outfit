package models

import "time"

type ProductTag struct {
	ProductID string    `gorm:"type:uuid;primaryKey;column:product_id"`
	TagID     string    `gorm:"type:uuid;primaryKey;column:tag_id"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (ProductTag) TableName() string { return "product_tags" }
