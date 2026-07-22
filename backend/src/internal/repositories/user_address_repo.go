package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

const MaxAddressesPerUser = 5

var (
	ErrMaxAddressesReached = errors.New("max addresses reached")
	ErrAddressNotFound     = errors.New("address not found")
)

type UserAddressRepository interface {
	CreateAddressAtomic(ctx context.Context, address *models.UserAddress) error
	ListAddressesByUserID(ctx context.Context, userID string) ([]*models.UserAddress, error)
	FindAddressByID(ctx context.Context, id string) (*models.UserAddress, error)
	UpdateAddress(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDeleteAddress(ctx context.Context, id string) error
	SetDefaultAddress(ctx context.Context, userID, addressID string) error
	CountAddressesByUserID(ctx context.Context, userID string) (int64, error)
}

func (r *postgreStorage) CreateAddressAtomic(ctx context.Context, address *models.UserAddress) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&models.UserAddress{}).
			Where("user_id = ?", address.UserID).
			Count(&count).Error; err != nil {
			return fmt.Errorf("failed to count addresses: %w", err)
		}
		if count >= MaxAddressesPerUser {
			return ErrMaxAddressesReached
		}

		if address.ID == "" {
			address.ID = uuid.New().String()
		}
		address.IsDefault = count == 0

		if err := tx.Create(address).Error; err != nil {
			return fmt.Errorf("failed to create address: %w", err)
		}
		return nil
	})
}

func (r *postgreStorage) ListAddressesByUserID(ctx context.Context, userID string) ([]*models.UserAddress, error) {
	var addresses []*models.UserAddress
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("is_default DESC, created_at DESC").
		Find(&addresses).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list addresses: %w", err)
	}
	return addresses, nil
}

func (r *postgreStorage) FindAddressByID(ctx context.Context, id string) (*models.UserAddress, error) {
	var address models.UserAddress
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&address).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find address: %w", err)
	}
	return &address, nil
}

func (r *postgreStorage) UpdateAddress(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.UserAddress{}).
		Where("id = ?", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update address: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrAddressNotFound
	}
	return nil
}

func (r *postgreStorage) SoftDeleteAddress(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.UserAddress{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete address: %w", result.Error)
	}
	return nil
}

func (r *postgreStorage) SetDefaultAddress(ctx context.Context, userID, addressID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.UserAddress{}).
			Where("user_id = ? AND is_default = ?", userID, true).
			Update("is_default", false).Error; err != nil {
			return fmt.Errorf("failed to unset default: %w", err)
		}
		result := tx.Model(&models.UserAddress{}).
			Where("id = ? AND user_id = ?", addressID, userID).
			Update("is_default", true)
		if result.Error != nil {
			return fmt.Errorf("failed to set default: %w", result.Error)
		}
		if result.RowsAffected == 0 {
			return ErrAddressNotFound
		}
		return nil
	})
}

func (r *postgreStorage) CountAddressesByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.UserAddress{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("failed to count addresses: %w", err)
	}
	return count, nil
}
