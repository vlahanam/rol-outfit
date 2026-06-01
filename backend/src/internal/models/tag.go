package models

import "time"

type Tag struct {
	ID        string     `gorm:"type:uuid;primaryKey"`
	Name      string     `gorm:"column:name"`
	NameJa    string     `gorm:"column:name_ja"`
	Slug      string     `gorm:"column:slug;uniqueIndex"`
	StartAt   *time.Time `gorm:"column:start_at"`
	EndAt     *time.Time `gorm:"column:end_at"`
	CreatedAt time.Time  `gorm:"column:created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at"`
}

func (Tag) TableName() string { return "tags" }
