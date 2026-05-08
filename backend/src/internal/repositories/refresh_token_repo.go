package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// RefreshTokenRepository defines persistence operations for refresh tokens.
type RefreshTokenRepository interface {
	SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error
	FindRefreshTokenByHash(ctx context.Context, hash string) (*models.RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, hash string) error
	RevokeTokenFamily(ctx context.Context, familyID string) error
	RevokeUserRefreshTokens(ctx context.Context, userID string) error
	DeleteExpiredRefreshTokens(ctx context.Context) error
}

func (r *postgreStorage) SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	if err := r.db.WithContext(ctx).Create(token).Error; err != nil {
		return fmt.Errorf("failed to save refresh token: %w", err)
	}
	return nil
}

// FindRefreshTokenByHash returns nil, nil when no record matches.
func (r *postgreStorage) FindRefreshTokenByHash(ctx context.Context, hash string) (*models.RefreshToken, error) {
	var t models.RefreshToken
	err := r.db.WithContext(ctx).
		Where("token_hash = ? AND expires_at > NOW()", hash).
		First(&t).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find refresh token: %w", err)
	}
	return &t, nil
}

func (r *postgreStorage) RevokeRefreshToken(ctx context.Context, hash string) error {
	result := r.db.WithContext(ctx).
		Model(&models.RefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", hash).
		Update("revoked_at", gorm.Expr("NOW()"))

	if result.Error != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgreStorage) RevokeTokenFamily(ctx context.Context, familyID string) error {
	result := r.db.WithContext(ctx).
		Model(&models.RefreshToken{}).
		Where("token_family = ? AND revoked_at IS NULL", familyID).
		Update("revoked_at", gorm.Expr("NOW()"))

	if result.Error != nil {
		return fmt.Errorf("failed to revoke token family: %w", result.Error)
	}
	return nil
}

func (r *postgreStorage) RevokeUserRefreshTokens(ctx context.Context, userID string) error {
	result := r.db.WithContext(ctx).
		Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", gorm.Expr("NOW()"))

	if result.Error != nil {
		return fmt.Errorf("failed to revoke user refresh tokens: %w", result.Error)
	}
	return nil
}

// DeleteExpiredRefreshTokens removes tokens that have expired or have been
// revoked for more than 30 days (retention window for audit purposes).
func (r *postgreStorage) DeleteExpiredRefreshTokens(ctx context.Context) error {
	result := r.db.WithContext(ctx).
		Where("expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')").
		Delete(&models.RefreshToken{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete expired refresh tokens: %w", result.Error)
	}
	return nil
}
