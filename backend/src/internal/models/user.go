package models

import (
	"time"

	"gorm.io/gorm"
)

const USER_ROLE_ADMIN = int8(1)
const USER_ROLE_CUSTOMER = int8(2)

const USER_STATUS_ACTIVE = int8(1)
const USER_STATUS_LOCKED = int8(0)

// AuthTokens chứa access token và refresh token
type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"` // seconds
}

type User struct {
	ID        string         `gorm:"type:uuid;primaryKey"`
	FullName  string         `gorm:"column:full_name"`
	Email     string         `gorm:"column:email"`
	Password  string         `gorm:"column:password"`
	Address   string         `gorm:"column:address"`
	Phone     string         `gorm:"column:phone"`
	Role      int8           `gorm:"column:role"`
	Status    int8           `gorm:"column:status"`
	CreatedAt time.Time      `gorm:"column:created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (User) TableName() string {
	return "users"
}
