package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type ProductVariantRepository interface {
	CreateVariant(ctx context.Context, v *models.ProductVariant) error
	FindVariantByID(ctx context.Context, id string) (*models.ProductVariant, error)
	ListVariants(ctx context.Context, productID string, offset, limit int) ([]*models.ProductVariant, int64, error)
	UpdateVariant(ctx context.Context, id string, fields map[string]interface{}) error
	DeleteVariant(ctx context.Context, id string) error
	DeductStock(ctx context.Context, variantID string, quantity int) error
	RestoreStock(ctx context.Context, variantID string, quantity int) error
}

func (r *postgreStorage) CreateVariant(ctx context.Context, v *models.ProductVariant) error {
	if err := r.db.WithContext(ctx).Create(v).Error; err != nil {
		return fmt.Errorf("failed to create variant: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindVariantByID(ctx context.Context, id string) (*models.ProductVariant, error) {
	var v models.ProductVariant
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&v).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find variant by id: %w", err)
	}
	return &v, nil
}

func (r *postgreStorage) ListVariants(ctx context.Context, productID string, offset, limit int) ([]*models.ProductVariant, int64, error) {
	var variants []*models.ProductVariant
	var total int64

	db := r.db.WithContext(ctx).Model(&models.ProductVariant{}).Where("product_id = ?", productID)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count variants: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at ASC").Find(&variants).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list variants: %w", err)
	}
	return variants, total, nil
}

func (r *postgreStorage) UpdateVariant(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.ProductVariant{}).
		Where("id = ?", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update variant: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("variant not found")
	}
	return nil
}

func (r *postgreStorage) DeleteVariant(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.ProductVariant{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete variant: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("variant not found")
	}
	return nil
}

func (r *postgreStorage) DeductStock(ctx context.Context, variantID string, quantity int) error {
	result := r.db.WithContext(ctx).
		Model(&models.ProductVariant{}).
		Where("id = ? AND stock >= ?", variantID, quantity).
		Updates(map[string]interface{}{
			"stock": gorm.Expr("stock - ?", quantity),
			"sold":  gorm.Expr("sold + ?", quantity),
		})
	if result.Error != nil {
		return fmt.Errorf("failed to deduct stock: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("insufficient stock or variant not found")
	}
	return nil
}

func (r *postgreStorage) RestoreStock(ctx context.Context, variantID string, quantity int) error {
	result := r.db.WithContext(ctx).
		Model(&models.ProductVariant{}).
		Where("id = ?", variantID).
		Updates(map[string]interface{}{
			"stock": gorm.Expr("stock + ?", quantity),
			"sold":  gorm.Expr("CASE WHEN sold - ? < 0 THEN 0 ELSE sold - ? END", quantity, quantity),
		})
	if result.Error != nil {
		return fmt.Errorf("failed to restore stock: %w", result.Error)
	}
	return nil
}
