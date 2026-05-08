package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// CategoryRepository defines DB operations for the categories table.
type CategoryRepository interface {
	CreateCategory(ctx context.Context, c *models.Category) error
	FindCategoryByID(ctx context.Context, id string) (*models.Category, error)
	FindCategoryByIDAdmin(ctx context.Context, id string) (*models.Category, error)
	FindCategoryBySlug(ctx context.Context, slug string) (*models.Category, error)
	ListCategories(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
	ListCategoriesAdmin(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
	UpdateCategory(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDeleteCategory(ctx context.Context, id string) error
}

func (r *postgreStorage) CreateCategory(ctx context.Context, c *models.Category) error {
	if err := r.db.WithContext(ctx).Create(c).Error; err != nil {
		return fmt.Errorf("failed to create category: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindCategoryByID(ctx context.Context, id string) (*models.Category, error) {
	var c models.Category
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL AND status = ?", id, models.CATEGORY_STATUS_ACTIVE).
		First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find category by id: %w", err)
	}
	return &c, nil
}

func (r *postgreStorage) FindCategoryBySlug(ctx context.Context, slug string) (*models.Category, error) {
	var c models.Category
	err := r.db.WithContext(ctx).
		Where("slug = ? AND deleted_at IS NULL", slug).
		First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find category by slug: %w", err)
	}
	return &c, nil
}

func (r *postgreStorage) FindCategoryByIDAdmin(ctx context.Context, id string) (*models.Category, error) {
	var c models.Category
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find category by id: %w", err)
	}
	return &c, nil
}

func (r *postgreStorage) ListCategories(ctx context.Context, offset, limit int) ([]*models.Category, int64, error) {
	var categories []*models.Category
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Category{}).Where("deleted_at IS NULL AND status = ?", models.CATEGORY_STATUS_ACTIVE)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&categories).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list categories: %w", err)
	}
	return categories, total, nil
}

func (r *postgreStorage) ListCategoriesAdmin(ctx context.Context, offset, limit int) ([]*models.Category, int64, error) {
	var categories []*models.Category
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Category{}).Where("deleted_at IS NULL")
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&categories).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list categories: %w", err)
	}
	return categories, total, nil
}

func (r *postgreStorage) UpdateCategory(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.Category{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update category: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found or already deleted")
	}
	return nil
}

func (r *postgreStorage) SoftDeleteCategory(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Model(&models.Category{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", time.Now())
	if result.Error != nil {
		return fmt.Errorf("failed to soft delete category: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found or already deleted")
	}
	return nil
}
