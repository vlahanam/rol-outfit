package repositories

import (
	"context"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type UploadRepository interface {
	CreateUpload(ctx context.Context, upload *models.Upload) error
	FindUploadByID(ctx context.Context, id string) (*models.Upload, error)
	FindUploadByPath(ctx context.Context, path string) (*models.Upload, error)
	SoftDeleteUpload(ctx context.Context, id string) error
	ListUploadsByModel(ctx context.Context, modelType, modelID string) ([]*models.Upload, error)
	ListUploadsByModels(ctx context.Context, modelType string, modelIDs []string) (map[string][]*models.Upload, error)
	ListUploadsByModelType(ctx context.Context, modelType string) ([]*models.Upload, error)
	UpdateUploadsModelID(ctx context.Context, ids []string, modelType string, modelID string) error
	ClearUploadsModelID(ctx context.Context, ids []string) error
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

func (r *postgreStorage) FindUploadByPath(ctx context.Context, path string) (*models.Upload, error) {
	var u models.Upload
	err := r.db.WithContext(ctx).
		Where("file_path = ? OR file_path LIKE ?", path, "%/"+path).
		First(&u).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find upload by path: %w", err)
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

func (r *postgreStorage) ListUploadsByModels(ctx context.Context, modelType string, modelIDs []string) (map[string][]*models.Upload, error) {
	var uploads []*models.Upload
	if err := r.db.WithContext(ctx).
		Where("model_type = ? AND model_id IN ?", modelType, modelIDs).
		Order("created_at DESC").
		Find(&uploads).Error; err != nil {
		return nil, fmt.Errorf("failed to list uploads by models: %w", err)
	}
	result := make(map[string][]*models.Upload, len(modelIDs))
	for _, u := range uploads {
		if u.ModelID != nil {
			result[*u.ModelID] = append(result[*u.ModelID], u)
		}
	}
	return result, nil
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

func (r *postgreStorage) ListUploadsByModelType(ctx context.Context, modelType string) ([]*models.Upload, error) {
	var uploads []*models.Upload
	if err := r.db.WithContext(ctx).
		Where("model_type = ?", modelType).
		Order("created_at DESC").
		Find(&uploads).Error; err != nil {
		return nil, fmt.Errorf("failed to list uploads by model type: %w", err)
	}
	return uploads, nil
}

func (r *postgreStorage) UpdateUploadsModelID(ctx context.Context, ids []string, modelType string, modelID string) error {
	if len(ids) == 0 {
		return nil
	}
	if err := r.db.WithContext(ctx).
		Model(&models.Upload{}).
		Where("id IN ? AND model_type = ?", ids, modelType).
		Update("model_id", modelID).Error; err != nil {
		return fmt.Errorf("failed to update uploads model_id: %w", err)
	}
	return nil
}

func (r *postgreStorage) ClearUploadsModelID(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	if err := r.db.WithContext(ctx).
		Model(&models.Upload{}).
		Where("id IN ?", ids).
		Update("model_id", nil).Error; err != nil {
		return fmt.Errorf("failed to clear uploads model_id: %w", err)
	}
	return nil
}
