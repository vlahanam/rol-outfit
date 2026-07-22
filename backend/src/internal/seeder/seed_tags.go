package seeder

import (
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedTag struct {
	Name   string
	NameJa string
	Slug   string
}

var tags = []seedTag{
	{Name: "Hàng mới", NameJa: "新着", Slug: "hang-moi"},
	{Name: "Bán chạy", NameJa: "人気商品", Slug: "ban-chay"},
	{Name: "Hot", NameJa: "ホット", Slug: "hot"},
	{Name: "Limited", NameJa: "限定", Slug: "limited"},
}

func SeedTags(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, t := range tags {
		var existing models.Tag
		err := db.Where("slug = ?", t.Slug).First(&existing).Error
		if err == nil {
			log.Printf("  skip tag (exists): %s", t.Slug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		now := time.Now()
		row := models.Tag{
			ID:        uuid.New().String(),
			Name:      t.Name,
			NameJa:    t.NameJa,
			Slug:      t.Slug,
			StartAt:   &now,
			EndAt:     nil,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created tag: %s", t.Slug)
		res.Created++
	}
	return res, nil
}
