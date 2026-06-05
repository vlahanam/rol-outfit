package seeder

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedCategory struct {
	Name          string
	NameJa        string
	Description   string
	DescriptionJa string
}

var categories = []seedCategory{
	{Name: "Áo Nam", NameJa: "メンズトップス", Description: "Bộ sưu tập áo dành cho nam giới", DescriptionJa: "メンズ向けトップスコレクション"},
	{Name: "Quần Nam", NameJa: "メンズボトムス", Description: "Quần dài, quần short cho nam", DescriptionJa: "メンズ向けパンツ、ショートパンツ"},
	{Name: "Áo Nữ", NameJa: "レディーストップス", Description: "Bộ sưu tập áo dành cho nữ giới", DescriptionJa: "レディース向けトップスコレクション"},
	{Name: "Quần Nữ", NameJa: "レディースボトムス", Description: "Quần dài, quần short cho nữ", DescriptionJa: "レディース向けパンツ、ショートパンツ"},
}

// SeedCategories inserts default categories; skips by matching slug.
func SeedCategories(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, c := range categories {
		slug := common.Slugify(c.Name)

		var existing models.Category
		err := db.Where("slug = ? AND deleted_at IS NULL", slug).First(&existing).Error
		if err == nil {
			log.Printf("  skip category (exists): %s", slug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		row := models.Category{
			ID:            uuid.New().String(),
			Name:          c.Name,
			NameJa:        c.NameJa,
			Slug:          slug,
			Status:        models.CATEGORY_STATUS_ACTIVE,
			Description:   c.Description,
			DescriptionJa: c.DescriptionJa,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created category: %s", slug)
		res.Created++
	}
	return res, nil
}
