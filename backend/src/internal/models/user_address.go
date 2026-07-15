package models

import (
	"time"

	"gorm.io/gorm"
)

type UserAddress struct {
	ID            string         `gorm:"type:uuid;primaryKey"`
	UserID        string         `gorm:"column:user_id;type:uuid;not null"`
	RecipientName string         `gorm:"column:recipient_name;size:100"`
	Phone         string         `gorm:"column:phone;size:15"`
	Address       string         `gorm:"column:address;type:text"`
	PostalCode    string         `gorm:"column:postal_code;size:20"`
	Latitude      *float64       `gorm:"column:latitude;type:double precision"`
	Longitude     *float64       `gorm:"column:longitude;type:double precision"`
	IsDefault     bool           `gorm:"column:is_default;default:false"`
	CreatedAt     time.Time      `gorm:"column:created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (UserAddress) TableName() string {
	return "user_addresses"
}
