package repositories

import (
	"context"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type UploadRepository interface {
	CreateUpload(ctx context.Context, upload *models.Upload) error
	FindUploadByID(ctx context.Context, id string) (*models.Upload, error)
	SoftDeleteUpload(ctx context.Context, id string) error
	ListUploadsByModel(ctx context.Context, modelType, modelID string) ([]*models.Upload, error)
}

func (r *postgreStorage) CreateUpload(ctx context.Context, upload *models.Upload) error {
	if err := r.db.WithContext(ctx).Create(upload).Error; err != nil {
		return fmt.Errorf("failed to create upload: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindUploadByID(ctx context.Context, id string) (*models.Upload, error) {
	var u models.Upload
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find upload: %w", err)
	}
	return &u, nil
}

func (r *postgreStorage) SoftDeleteUpload(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Upload{})
	if result.Error != nil {
		return fmt.Errorf("failed to soft delete upload: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *postgreStorage) ListUploadsByModel(ctx context.Context, modelType, modelID string) ([]*models.Upload, error) {
	var uploads []*models.Upload
	if err := r.db.WithContext(ctx).
		Where("model_type = ? AND model_id = ?", modelType, modelID).
		Order("created_at DESC").
		Find(&uploads).Error; err != nil {
		return nil, fmt.Errorf("failed to list uploads by model: %w", err)
	}
	return uploads, nil
}
