package models

import (
	"encoding/json"
	"time"
)

const (
	WIDGET_STATUS_HIDDEN = int8(1)
	WIDGET_STATUS_ACTIVE = int8(2)
)

type Widget struct {
	ID           string          `gorm:"type:uuid;primaryKey"`
	ParentID     *string         `gorm:"column:parent_id;type:uuid"`
	Name         string          `gorm:"column:name"`
	Type         string          `gorm:"column:type"`
	DisplayOrder int             `gorm:"column:display_order"`
	Depth        int             `gorm:"column:depth;default:0"`
	Status       int8            `gorm:"column:status"`
	Settings     json.RawMessage `gorm:"column:settings;type:jsonb"`
	CreatedAt    time.Time       `gorm:"column:created_at"`
	UpdatedAt    time.Time       `gorm:"column:updated_at"`
}

func (Widget) TableName() string { return "widgets" }
