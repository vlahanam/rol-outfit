package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// WidgetRepository defines DB operations for the widgets table.
type WidgetRepository interface {
	CreateWidget(ctx context.Context, w *models.Widget) error
	FindWidgetByID(ctx context.Context, id string) (*models.Widget, error)
	FindWidgetByIDAdmin(ctx context.Context, id string) (*models.Widget, error)
	ListWidgets(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error)
	ListWidgetsAdmin(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error)
	ListAllWidgets(ctx context.Context) ([]*models.Widget, error)
	MaxWidgetDisplayOrder(ctx context.Context, parentID *string) (int, error)
	UpdateWidget(ctx context.Context, id string, fields map[string]interface{}) error
	DeleteWidget(ctx context.Context, id string) error
}

func (r *postgreStorage) CreateWidget(ctx context.Context, w *models.Widget) error {
	if err := r.db.WithContext(ctx).Create(w).Error; err != nil {
		return fmt.Errorf("failed to create widget: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindWidgetByID(ctx context.Context, id string) (*models.Widget, error) {
	var w models.Widget
	err := r.db.WithContext(ctx).
		Where("id = ? AND status = ?", id, models.WIDGET_STATUS_ACTIVE).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find widget by id: %w", err)
	}
	return &w, nil
}

func (r *postgreStorage) FindWidgetByIDAdmin(ctx context.Context, id string) (*models.Widget, error) {
	var w models.Widget
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find widget by id (admin): %w", err)
	}
	return &w, nil
}

func (r *postgreStorage) ListWidgets(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error) {
	var widgets []*models.Widget
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Widget{})
	if parentID != nil {
		db = db.Where("parent_id = ? AND status = ?", *parentID, models.WIDGET_STATUS_ACTIVE)
	} else {
		db = db.Where("parent_id IS NULL AND status = ?", models.WIDGET_STATUS_ACTIVE)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count widgets: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("display_order ASC").Find(&widgets).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list widgets: %w", err)
	}
	return widgets, total, nil
}

func (r *postgreStorage) ListWidgetsAdmin(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error) {
	var widgets []*models.Widget
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Widget{})
	if parentID != nil {
		db = db.Where("parent_id = ?", *parentID)
	} else {
		db = db.Where("parent_id IS NULL")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count widgets (admin): %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("display_order ASC").Find(&widgets).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list widgets (admin): %w", err)
	}
	return widgets, total, nil
}

func (r *postgreStorage) ListAllWidgets(ctx context.Context) ([]*models.Widget, error) {
	var widgets []*models.Widget
	if err := r.db.WithContext(ctx).Model(&models.Widget{}).Find(&widgets).Error; err != nil {
		return nil, fmt.Errorf("failed to list all widgets: %w", err)
	}
	return widgets, nil
}

func (r *postgreStorage) MaxWidgetDisplayOrder(ctx context.Context, parentID *string) (int, error) {
	var maxOrder int
	db := r.db.WithContext(ctx).Model(&models.Widget{})
	if parentID != nil {
		db = db.Where("parent_id = ?", *parentID)
	} else {
		db = db.Where("parent_id IS NULL")
	}
	if err := db.Select("COALESCE(MAX(display_order), 0)").Scan(&maxOrder).Error; err != nil {
		return 0, fmt.Errorf("failed to get max display order: %w", err)
	}
	return maxOrder, nil
}

func (r *postgreStorage) UpdateWidget(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.Widget{}).
		Where("id = ?", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update widget: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("widget not found")
	}
	return nil
}

func (r *postgreStorage) DeleteWidget(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.Widget{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete widget: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("widget not found")
	}
	return nil
}
