package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type ProductTagRepository interface {
	ReplaceProductTags(ctx context.Context, productID string, tagIDs []string) error
	FindActiveTagsByProductID(ctx context.Context, productID string, now time.Time) ([]*models.Tag, error)
	FindAllTagsByProductID(ctx context.Context, productID string) ([]*models.Tag, error)
}

func (r *postgreStorage) ReplaceProductTags(ctx context.Context, productID string, tagIDs []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", productID).Delete(&models.ProductTag{}).Error; err != nil {
			return fmt.Errorf("failed to delete existing product tags: %w", err)
		}
		if len(tagIDs) == 0 {
			return nil
		}
		rows := make([]models.ProductTag, 0, len(tagIDs))
		for _, tid := range tagIDs {
			rows = append(rows, models.ProductTag{ProductID: productID, TagID: tid})
		}
		if err := tx.Create(&rows).Error; err != nil {
			return fmt.Errorf("failed to insert product tags: %w", err)
		}
		return nil
	})
}

func (r *postgreStorage) FindActiveTagsByProductID(ctx context.Context, productID string, now time.Time) ([]*models.Tag, error) {
	var tags []*models.Tag
	err := r.db.WithContext(ctx).
		Joins("JOIN product_tags ON product_tags.tag_id = tags.id").
		Where("product_tags.product_id = ?", productID).
		Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
		Find(&tags).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find active tags for product: %w", err)
	}
	return tags, nil
}

func (r *postgreStorage) FindAllTagsByProductID(ctx context.Context, productID string) ([]*models.Tag, error) {
	var tags []*models.Tag
	err := r.db.WithContext(ctx).
		Joins("JOIN product_tags ON product_tags.tag_id = tags.id").
		Where("product_tags.product_id = ?", productID).
		Find(&tags).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find all tags for product: %w", err)
	}
	return tags, nil
}
