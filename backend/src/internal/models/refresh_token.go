package models

import "time"

type RefreshToken struct {
	ID          string     `gorm:"type:uuid;primaryKey"`
	UserID      string     `gorm:"column:user_id;type:uuid;not null"`
	TokenHash   string     `gorm:"column:token_hash;uniqueIndex;not null"`
	TokenFamily string     `gorm:"column:token_family;type:uuid;not null"`
	ExpiresAt   time.Time  `gorm:"column:expires_at;not null"`
	RevokedAt   *time.Time `gorm:"column:revoked_at"`
	CreatedAt   time.Time  `gorm:"column:created_at;autoCreateTime"`
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
