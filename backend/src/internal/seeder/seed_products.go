package seeder

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedProduct struct {
	CategorySlug string
	Name         string
	Price        float64
	Description  string
}

// 3 products per category = 12 total. Prices in VND, range 150k–850k.
var products = []seedProduct{
	// Áo Nam
	{CategorySlug: "ao-nam", Name: "Áo Sơ Mi Trắng Nam Basic", Price: 350000, Description: "Áo sơ mi cotton trắng, form regular fit"},
	{CategorySlug: "ao-nam", Name: "Áo Thun Nam Cổ Tròn", Price: 180000, Description: "Áo thun cotton 100%, thoáng mát"},
	{CategorySlug: "ao-nam", Name: "Áo Polo Nam Kẻ Sọc", Price: 420000, Description: "Áo polo phối kẻ, lịch sự năng động"},
	// Quần Nam
	{CategorySlug: "quan-nam", Name: "Quần Jean Nam Slim Fit", Price: 650000, Description: "Quần jean slim, chất denim co giãn"},
	{CategorySlug: "quan-nam", Name: "Quần Tây Nam Công Sở", Price: 550000, Description: "Quần tây vải tuytsi, dáng straight"},
	{CategorySlug: "quan-nam", Name: "Quần Short Kaki Nam", Price: 280000, Description: "Quần short kaki mùa hè"},
	// Áo Nữ
	{CategorySlug: "ao-nu", Name: "Áo Sơ Mi Nữ Tay Phồng", Price: 380000, Description: "Áo sơ mi tay bồng phong cách Hàn"},
	{CategorySlug: "ao-nu", Name: "Áo Thun Nữ Crop Top", Price: 199000, Description: "Áo crop top trẻ trung"},
	{CategorySlug: "ao-nu", Name: "Áo Kiểu Nữ Voan Hoa", Price: 450000, Description: "Áo voan họa tiết hoa nhí"},
	// Quần Nữ
	{CategorySlug: "quan-nu", Name: "Quần Jean Nữ Ống Rộng", Price: 620000, Description: "Quần jean ống suông cá tính"},
	{CategorySlug: "quan-nu", Name: "Quần Tây Nữ Lưng Cao", Price: 520000, Description: "Quần tây cạp cao thanh lịch"},
	{CategorySlug: "quan-nu", Name: "Chân Váy Chữ A Nữ", Price: 320000, Description: "Chân váy chữ A vải tweed"},
}

var defaultProductData = json.RawMessage(`{"material":"cotton","sizes":["S","M","L","XL"]}`)

// SeedProducts inserts default products; skips by matching slug.
// Resolves CategoryID by looking up category slug — must run after SeedCategories.
func SeedProducts(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, p := range products {
		var cat models.Category
		if err := db.Where("slug = ? AND deleted_at IS NULL", p.CategorySlug).First(&cat).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("  skip product (category missing): %s -> %s", p.Name, p.CategorySlug)
				res.Skipped++
				continue
			}
			return res, err
		}

		slug := common.Slugify(p.Name)
		var existing models.Product
		err := db.Where("slug = ? AND deleted_at IS NULL", slug).First(&existing).Error
		if err == nil {
			log.Printf("  skip product (exists): %s", slug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		row := models.Product{
			ID:           uuid.New().String(),
			CategoryID:   cat.ID,
			Name:         p.Name,
			Slug:         slug,
			DefaultPrice: p.Price,
			Description:  p.Description,
			Status:       models.PRODUCT_STATUS_ACTIVE,
			Data:         json.RawMessage(string(defaultProductData)),
			Avatar:       "",
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created product: %s", slug)
		res.Created++
	}
	return res, nil
}
