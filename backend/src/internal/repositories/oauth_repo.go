package repositories

import (
	"context"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type OAuthRepository interface {
	FindByProvider(ctx context.Context, provider, providerUserID string) (*models.UserOAuthProvider, error)
	FindByUserID(ctx context.Context, userID string) ([]models.UserOAuthProvider, error)
	Create(ctx context.Context, oauth *models.UserOAuthProvider) error
	Delete(ctx context.Context, userID, provider string) error
}

type oauthRepository struct {
	db *gorm.DB
}

func NewOAuthRepository(db *gorm.DB) OAuthRepository {
	return &oauthRepository{db: db}
}

func (r *oauthRepository) FindByProvider(ctx context.Context, provider, providerUserID string) (*models.UserOAuthProvider, error) {
	var oauth models.UserOAuthProvider
	err := r.db.WithContext(ctx).
		Where("provider = ? AND provider_user_id = ?", provider, providerUserID).
		First(&oauth).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &oauth, nil
}

func (r *oauthRepository) FindByUserID(ctx context.Context, userID string) ([]models.UserOAuthProvider, error) {
	var providers []models.UserOAuthProvider
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&providers).Error
	return providers, err
}

func (r *oauthRepository) Create(ctx context.Context, oauth *models.UserOAuthProvider) error {
	return r.db.WithContext(ctx).Create(oauth).Error
}

func (r *oauthRepository) Delete(ctx context.Context, userID, provider string) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND provider = ?", userID, provider).
		Delete(&models.UserOAuthProvider{}).Error
}
