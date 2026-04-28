package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	CATEGORY_STATUS_ACTIVE = int8(1)
	CATEGORY_STATUS_HIDDEN = int8(2)
)

type Category struct {
	ID          string         `gorm:"type:uuid;primaryKey"`
	Name        string         `gorm:"column:name"`
	Slug        string         `gorm:"column:slug"`
	Status      int8           `gorm:"column:status"`
	Description string         `gorm:"column:description"`
	CreatedAt   time.Time      `gorm:"column:created_at"`
	UpdatedAt   time.Time      `gorm:"column:updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Category) TableName() string { return "categories" }
