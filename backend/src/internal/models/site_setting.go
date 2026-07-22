package models

import "time"

type SiteSetting struct {
	Key         string    `gorm:"column:key;primaryKey"`
	Value       string    `gorm:"column:value"`
	Description string    `gorm:"column:description"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (SiteSetting) TableName() string { return "site_settings" }
