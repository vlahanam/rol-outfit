package models

import (
	"time"

	"gorm.io/gorm"
)

type Upload struct {
	ID           string         `gorm:"type:uuid;primaryKey"`
	OriginalName string         `gorm:"column:original_name"`
	FilePath     string         `gorm:"column:file_path"`
	FileSize     int64          `gorm:"column:file_size"`
	MimeType     string         `gorm:"column:mime_type"`
	ModelType    string         `gorm:"column:model_type"`
	ModelID      string         `gorm:"column:model_id;type:uuid"`
	Metadata     JSONB          `gorm:"column:metadata;type:jsonb"`
	CreatedAt    time.Time      `gorm:"column:created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Upload) TableName() string { return "uploads" }
