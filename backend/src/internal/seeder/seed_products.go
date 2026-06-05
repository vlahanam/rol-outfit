package seeder

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedProduct struct {
	CategorySlug   string
	Name           string
	NameJa         string
	Price          float64
	Description    string
	DescriptionJa  string
	AttributeNames models.StringSlice
}

// 3 products per category = 12 total. Prices in VND, range 150k–850k.
var products = []seedProduct{
	// Áo Nam
	{CategorySlug: "ao-nam", Name: "Áo Sơ Mi Trắng Nam Basic", NameJa: "メンズベーシック白シャツ", Price: 350000, Description: "Áo sơ mi cotton trắng, form regular fit", DescriptionJa: "コットン白シャツ、レギュラーフィット", AttributeNames: models.StringSlice{"Size", "Color"}},
	{CategorySlug: "ao-nam", Name: "Áo Thun Nam Cổ Tròn", NameJa: "メンズクルーネックTシャツ", Price: 180000, Description: "Áo thun cotton 100%, thoáng mát", DescriptionJa: "コットン100%、通気性抜群", AttributeNames: models.StringSlice{"Size", "Color", "Material"}},
	{CategorySlug: "ao-nam", Name: "Áo Polo Nam Kẻ Sọc", NameJa: "メンズストライプポロシャツ", Price: 420000, Description: "Áo polo phối kẻ, lịch sự năng động", DescriptionJa: "ストライプ柄ポロ、上品でアクティブ", AttributeNames: models.StringSlice{"Size", "Color"}},
	// Quần Nam
	{CategorySlug: "quan-nam", Name: "Quần Jean Nam Slim Fit", NameJa: "メンズスリムフィットジーンズ", Price: 650000, Description: "Quần jean slim, chất denim co giãn", DescriptionJa: "スリムジーンズ、ストレッチデニム", AttributeNames: models.StringSlice{"Waist", "Color"}},
	{CategorySlug: "quan-nam", Name: "Quần Tây Nam Công Sở", NameJa: "メンズオフィススラックス", Price: 550000, Description: "Quần tây vải tuytsi, dáng straight", DescriptionJa: "ツイード生地スラックス、ストレートシルエット", AttributeNames: models.StringSlice{"Waist", "Color"}},
	{CategorySlug: "quan-nam", Name: "Quần Short Kaki Nam", NameJa: "メンズカーキショートパンツ", Price: 280000, Description: "Quần short kaki mùa hè", DescriptionJa: "夏向けカーキショートパンツ", AttributeNames: models.StringSlice{"Size", "Color"}},
	// Áo Nữ
	{CategorySlug: "ao-nu", Name: "Áo Sơ Mi Nữ Tay Phồng", NameJa: "レディースパフスリーブブラウス", Price: 380000, Description: "Áo sơ mi tay bồng phong cách Hàn", DescriptionJa: "韓国風パフスリーブブラウス", AttributeNames: models.StringSlice{"Size", "Color"}},
	{CategorySlug: "ao-nu", Name: "Áo Thun Nữ Crop Top", NameJa: "レディースクロップトップ", Price: 199000, Description: "Áo crop top trẻ trung", DescriptionJa: "若々しいクロップトップ", AttributeNames: models.StringSlice{"Size", "Color"}},
	{CategorySlug: "ao-nu", Name: "Áo Kiểu Nữ Voan Hoa", NameJa: "レディースフローラルシフォンブラウス", Price: 450000, Description: "Áo voan họa tiết hoa nhí", DescriptionJa: "小花柄シフォンブラウス", AttributeNames: models.StringSlice{"Size", "Color"}},
	// Quần Nữ
	{CategorySlug: "quan-nu", Name: "Quần Jean Nữ Ống Rộng", NameJa: "レディースワイドレッグジーンズ", Price: 620000, Description: "Quần jean ống suông cá tính", DescriptionJa: "個性的なワイドレッグジーンズ", AttributeNames: models.StringSlice{"Waist", "Color"}},
	{CategorySlug: "quan-nu", Name: "Quần Tây Nữ Lưng Cao", NameJa: "レディースハイウエストスラックス", Price: 520000, Description: "Quần tây cạp cao thanh lịch", DescriptionJa: "エレガントなハイウエストスラックス", AttributeNames: models.StringSlice{"Waist", "Color"}},
	{CategorySlug: "quan-nu", Name: "Chân Váy Chữ A Nữ", NameJa: "レディースAラインスカート", Price: 320000, Description: "Chân váy chữ A vải tweed", DescriptionJa: "ツイード生地Aラインスカート", AttributeNames: models.StringSlice{"Size", "Color", "Length"}},
}

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
			ID:             uuid.New().String(),
			CategoryID:     cat.ID,
			Name:           p.Name,
			NameJa:         p.NameJa,
			Slug:           slug,
			DefaultPrice:   p.Price,
			Description:    p.Description,
			DescriptionJa:  p.DescriptionJa,
			Status:         models.PRODUCT_STATUS_ACTIVE,
			AttributeNames: p.AttributeNames,
			Avatar:         "",
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created product: %s", slug)
		res.Created++
	}
	return res, nil
}
