package seeder

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedWidget struct {
	Name         string
	NameJa       string
	Type         models.WidgetType
	DisplayOrder int
	Status       int8
	TagSlugs     []string
	Settings     map[string]interface{}
}

// 4 widget cố định hiển thị trên trang chủ.
var widgets = []seedWidget{
	{Name: "Banner Slider", NameJa: "バナースライダー", Type: models.WidgetTypeBannerSlider, DisplayOrder: 1, Status: 2},
	{Name: "Bộ Sưu Tập Đặc Biệt", NameJa: "特別コレクション", Type: models.WidgetTypeCollectionGrid, DisplayOrder: 2, Status: 2},
	{Name: "Hàng Mới Về", NameJa: "新着商品", Type: models.WidgetTypeNewProduct, DisplayOrder: 3, Status: 2, TagSlugs: []string{"hang-moi"}, Settings: map[string]interface{}{"quantity": 12, "columns": 4}},
	{Name: "Xu Hướng Hot", NameJa: "人気トレンド", Type: models.WidgetTypeTrendHot, DisplayOrder: 4, Status: 2, TagSlugs: []string{"hot"}, Settings: map[string]interface{}{"quantity": 8, "columns": 4}},
}

// SeedWidgets inserts the 4 fixed homepage widgets; skips if name already exists.
func SeedWidgets(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, w := range widgets {
		var existing models.Widget
		err := db.Where("name = ?", w.Name).First(&existing).Error
		if err == nil {
			log.Printf("  skip widget (exists): %s", w.Name)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		var metadata, settings json.RawMessage
		if len(w.TagSlugs) > 0 {
			tagIDs, err := resolveTagIDs(db, w.TagSlugs)
			if err != nil {
				return res, fmt.Errorf("resolve tags for widget %s: %w", w.Name, err)
			}
			if metaBytes, err := json.Marshal(map[string]interface{}{"tag_ids": tagIDs}); err == nil {
				metadata = metaBytes
			}
		}
		if w.Settings != nil {
			if settingsBytes, err := json.Marshal(w.Settings); err == nil {
				settings = settingsBytes
			}
		}

		row := models.Widget{
			ID:           uuid.New().String(),
			Name:         w.Name,
			NameJa:       w.NameJa,
			Type:         w.Type,
			DisplayOrder: w.DisplayOrder,
			Status:       w.Status,
			Metadata:     metadata,
			Settings:     settings,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created widget: %s", w.Name)
		res.Created++
	}
	return res, nil
}

func resolveTagIDs(db *gorm.DB, slugs []string) ([]string, error) {
	var tags []models.Tag
	if err := db.Where("slug IN ?", slugs).Find(&tags).Error; err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(tags))
	for _, t := range tags {
		ids = append(ids, t.ID)
	}
	return ids, nil
}
