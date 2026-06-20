package models

import "time"

type UserOAuthProvider struct {
	ID             string    `gorm:"type:uuid;primaryKey"`
	UserID         string    `gorm:"column:user_id;type:uuid;not null"`
	Provider       string    `gorm:"column:provider;type:varchar(20);not null"`
	ProviderUserID string    `gorm:"column:provider_user_id;type:varchar(255);not null"`
	Email          *string   `gorm:"column:email;type:varchar(255)"`
	Name           *string   `gorm:"column:name;type:varchar(255)"`
	AvatarURL      *string   `gorm:"column:avatar_url;type:text"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`

	User User `gorm:"foreignKey:UserID"`
}

func (UserOAuthProvider) TableName() string {
	return "user_oauth_providers"
}

const (
	OAuthProviderGoogle = "google"
)
