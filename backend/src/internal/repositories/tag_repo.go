package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type TagRepository interface {
	CreateTag(ctx context.Context, t *models.Tag) error
	FindTagByID(ctx context.Context, id string) (*models.Tag, error)
	FindTagByIDAdmin(ctx context.Context, id string) (*models.Tag, error)
	FindTagBySlug(ctx context.Context, slug string) (*models.Tag, error)
	FindTagsByIDs(ctx context.Context, ids []string) ([]*models.Tag, error)
	ListTags(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error)
	ListActiveTags(ctx context.Context, now time.Time, offset, limit int) ([]*models.Tag, int64, error)
	UpdateTag(ctx context.Context, id string, fields map[string]interface{}) error
	DeleteTag(ctx context.Context, id string) error
}

func (r *postgreStorage) CreateTag(ctx context.Context, t *models.Tag) error {
	if err := r.db.WithContext(ctx).Create(t).Error; err != nil {
		return fmt.Errorf("failed to create tag: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindTagByID(ctx context.Context, id string) (*models.Tag, error) {
	now := time.Now()
	var t models.Tag
	err := r.db.WithContext(ctx).
		Where("id = ? AND (start_at IS NULL OR start_at <= ?) AND (end_at IS NULL OR end_at >= ?)", id, now, now).
		First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find tag: %w", err)
	}
	return &t, nil
}

func (r *postgreStorage) FindTagByIDAdmin(ctx context.Context, id string) (*models.Tag, error) {
	var t models.Tag
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find tag: %w", err)
	}
	return &t, nil
}

func (r *postgreStorage) FindTagBySlug(ctx context.Context, slug string) (*models.Tag, error) {
	var t models.Tag
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find tag by slug: %w", err)
	}
	return &t, nil
}

func (r *postgreStorage) FindTagsByIDs(ctx context.Context, ids []string) ([]*models.Tag, error) {
	if len(ids) == 0 {
		return []*models.Tag{}, nil
	}
	var tags []*models.Tag
	if err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("failed to find tags by ids: %w", err)
	}
	return tags, nil
}

func (r *postgreStorage) ListTags(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error) {
	var tags []*models.Tag
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Tag{})
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count tags: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tags).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list tags: %w", err)
	}
	return tags, total, nil
}

func (r *postgreStorage) ListActiveTags(ctx context.Context, now time.Time, offset, limit int) ([]*models.Tag, int64, error) {
	var tags []*models.Tag
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Tag{}).
		Where("(start_at IS NULL OR start_at <= ?) AND (end_at IS NULL OR end_at >= ?)", now, now)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count active tags: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tags).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list active tags: %w", err)
	}
	return tags, total, nil
}

func (r *postgreStorage) UpdateTag(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).Model(&models.Tag{}).Where("id = ?", id).Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update tag: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgreStorage) DeleteTag(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Tag{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete tag: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
