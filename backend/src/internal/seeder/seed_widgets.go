package seeder

import (
	"errors"
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
}

// 4 widget cố định hiển thị trên trang chủ.
var widgets = []seedWidget{
	{Name: "Banner Slider", NameJa: "バナースライダー", Type: models.WidgetTypeBannerSlider, DisplayOrder: 1, Status: 2},
	{Name: "Bộ Sưu Tập Đặc Biệt", NameJa: "特別コレクション", Type: models.WidgetTypeCollectionGrid, DisplayOrder: 2, Status: 2},
	{Name: "Hàng Mới Về", NameJa: "新着商品", Type: models.WidgetTypeNewProduct, DisplayOrder: 3, Status: 2},
	{Name: "Xu Hướng Hot", NameJa: "人気トレンド", Type: models.WidgetTypeTrendHot, DisplayOrder: 4, Status: 2},
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

		row := models.Widget{
			ID:           uuid.New().String(),
			Name:         w.Name,
			NameJa:       w.NameJa,
			Type:         w.Type,
			DisplayOrder: w.DisplayOrder,
			Status:       w.Status,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created widget: %s", w.Name)
		res.Created++
	}
	return res, nil
}
