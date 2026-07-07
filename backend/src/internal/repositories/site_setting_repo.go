package repositories

import (
	"context"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SiteSettingRepository interface {
	GetSetting(ctx context.Context, key string) (*models.SiteSetting, error)
	GetSettings(ctx context.Context, keys []string) ([]*models.SiteSetting, error)
	UpdateSetting(ctx context.Context, key, value string) error
	UpdateSettings(ctx context.Context, settings map[string]string) error
}

func (s *postgreStorage) GetSetting(ctx context.Context, key string) (*models.SiteSetting, error) {
	var setting models.SiteSetting
	if err := s.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error; err != nil {
		return nil, err
	}
	return &setting, nil
}

func (s *postgreStorage) GetSettings(ctx context.Context, keys []string) ([]*models.SiteSetting, error) {
	var settings []*models.SiteSetting
	if err := s.db.WithContext(ctx).Where("key IN ?", keys).Find(&settings).Error; err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *postgreStorage) UpdateSetting(ctx context.Context, key, value string) error {
	setting := models.SiteSetting{
		Key:       key,
		Value:     value,
		UpdatedAt: time.Now(),
	}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&setting).Error
}

func (s *postgreStorage) UpdateSettings(ctx context.Context, settings map[string]string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for key, value := range settings {
			setting := models.SiteSetting{
				Key:       key,
				Value:     value,
				UpdatedAt: time.Now(),
			}
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
			}).Create(&setting).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
