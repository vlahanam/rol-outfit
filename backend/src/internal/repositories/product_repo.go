package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// ProductRepository defines DB operations for the products table.
type ProductRepository interface {
	CreateProduct(ctx context.Context, p *models.Product) error
	FindProductByID(ctx context.Context, id string) (*models.Product, error)
	FindProductBySlug(ctx context.Context, slug string) (*models.Product, error)
	ListProducts(ctx context.Context, categoryID string, offset, limit int) ([]*models.Product, int64, error)
	UpdateProduct(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDeleteProduct(ctx context.Context, id string) error
}

func (r *postgreStorage) CreateProduct(ctx context.Context, p *models.Product) error {
	if err := r.db.WithContext(ctx).Create(p).Error; err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindProductByID(ctx context.Context, id string) (*models.Product, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL AND status = ?", id, models.PRODUCT_STATUS_ACTIVE).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product by id: %w", err)
	}
	return &p, nil
}

func (r *postgreStorage) FindProductBySlug(ctx context.Context, slug string) (*models.Product, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("slug = ? AND deleted_at IS NULL", slug).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product by slug: %w", err)
	}
	return &p, nil
}

func (r *postgreStorage) ListProducts(ctx context.Context, categoryID string, offset, limit int) ([]*models.Product, int64, error) {
	var products []*models.Product
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Product{}).Where("deleted_at IS NULL AND status = ?", models.PRODUCT_STATUS_ACTIVE)
	if categoryID != "" {
		db = db.Where("category_id = ?", categoryID)
	}
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list products: %w", err)
	}
	return products, total, nil
}

func (r *postgreStorage) UpdateProduct(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update product: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found or already deleted")
	}
	return nil
}

func (r *postgreStorage) SoftDeleteProduct(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", time.Now())
	if result.Error != nil {
		return fmt.Errorf("failed to soft delete product: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found or already deleted")
	}
	return nil
}
