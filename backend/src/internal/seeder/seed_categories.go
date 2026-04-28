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
	Name        string
	Description string
}

var categories = []seedCategory{
	{Name: "Áo Nam", Description: "Bộ sưu tập áo dành cho nam giới"},
	{Name: "Quần Nam", Description: "Quần dài, quần short cho nam"},
	{Name: "Áo Nữ", Description: "Bộ sưu tập áo dành cho nữ giới"},
	{Name: "Quần Nữ", Description: "Quần dài, quần short cho nữ"},
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
			ID:          uuid.New().String(),
			Name:        c.Name,
			Slug:        slug,
			Status:      models.CATEGORY_STATUS_ACTIVE,
			Description: c.Description,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created category: %s", slug)
		res.Created++
	}
	return res, nil
}
