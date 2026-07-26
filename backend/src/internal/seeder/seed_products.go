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
	CategorySlug    string
	Name            string
	NameJa          string
	Price           float64
	ShippingCost    float64
	Description     string
	DescriptionJa   string
	AttributeNames  models.StringSlice
	ProductType     int8
	DiscountPercent float64
}

var products = []seedProduct{
	// ========== HÀNG VIỆT NAM (ProductType = 2, giá VNĐ) ==========
	// Áo Nam
	{CategorySlug: "ao-nam", Name: "Áo Sơ Mi Trắng Nam Basic", NameJa: "メンズベーシック白シャツ", Price: 350000, ShippingCost: 30000, Description: "Áo sơ mi cotton trắng, form regular fit, phù hợp công sở", DescriptionJa: "コットン白シャツ、レギュラーフィット、オフィス向け", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 15},
	{CategorySlug: "ao-nam", Name: "Áo Thun Nam Cổ Tròn", NameJa: "メンズクルーネックTシャツ", Price: 180000, ShippingCost: 25000, Description: "Áo thun cotton 100%, thoáng mát, phù hợp mọi hoạt động", DescriptionJa: "コットン100%、通気性抜群、あらゆる活動に最適", AttributeNames: models.StringSlice{"Size", "Color", "Material"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 10},
	{CategorySlug: "ao-nam", Name: "Áo Polo Nam Kẻ Sọc", NameJa: "メンズストライプポロシャツ", Price: 420000, ShippingCost: 30000, Description: "Áo polo phối kẻ, lịch sự năng động, chất liệu cao cấp", DescriptionJa: "ストライプ柄ポロ、上品でアクティブ、高品質素材", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 0},

	// Quần Nam
	{CategorySlug: "quan-nam", Name: "Quần Jean Nam Slim Fit", NameJa: "メンズスリムフィットジーンズ", Price: 650000, ShippingCost: 35000, Description: "Quần jean slim, chất denim co giãn, form chuẩn đẹp", DescriptionJa: "スリムジーンズ、ストレッチデニム、美しいシルエット", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 20},
	{CategorySlug: "quan-nam", Name: "Quần Tây Nam Công Sở", NameJa: "メンズオフィススラックス", Price: 550000, ShippingCost: 35000, Description: "Quần tây vải tuytsi, dáng straight, lịch lãm công sở", DescriptionJa: "ツイード生地スラックス、ストレート、オフィス向け", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 0},
	{CategorySlug: "quan-nam", Name: "Quần Short Kaki Nam", NameJa: "メンズカーキショートパンツ", Price: 280000, ShippingCost: 25000, Description: "Quần short kaki thoáng mát cho mùa hè", DescriptionJa: "夏向けカーキショートパンツ、通気性抜群", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 25},

	// Áo Nữ
	{CategorySlug: "ao-nu", Name: "Áo Sơ Mi Nữ Tay Phồng", NameJa: "レディースパフスリーブブラウス", Price: 380000, ShippingCost: 30000, Description: "Áo sơ mi tay bồng phong cách Hàn, nữ tính thanh lịch", DescriptionJa: "韓国風パフスリーブブラウス、フェミニンでエレガント", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 0},
	{CategorySlug: "ao-nu", Name: "Áo Thun Nữ Crop Top", NameJa: "レディースクロップトップ", Price: 199000, ShippingCost: 20000, Description: "Áo crop top trẻ trung, năng động cho các bạn nữ", DescriptionJa: "若々しくアクティブなクロップトップ", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 30},
	{CategorySlug: "ao-nu", Name: "Áo Kiểu Nữ Voan Hoa", NameJa: "レディースフローラルシフォンブラウス", Price: 450000, ShippingCost: 30000, Description: "Áo voan họa tiết hoa nhí, nhẹ nhàng bay bổng", DescriptionJa: "小花柄シフォンブラウス、軽やかで上品", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 0},

	// Quần Nữ
	{CategorySlug: "quan-nu", Name: "Quần Jean Nữ Ống Rộng", NameJa: "レディースワイドレッグジーンズ", Price: 620000, ShippingCost: 35000, Description: "Quần jean ống suông cá tính, phong cách retro", DescriptionJa: "個性的なワイドレッグジーンズ、レトロスタイル", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 15},
	{CategorySlug: "quan-nu", Name: "Quần Tây Nữ Lưng Cao", NameJa: "レディースハイウエストスラックス", Price: 520000, ShippingCost: 35000, Description: "Quần tây cạp cao thanh lịch, tôn dáng hoàn hảo", DescriptionJa: "エレガントなハイウエストスラックス、美シルエット", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 0},
	{CategorySlug: "quan-nu", Name: "Chân Váy Chữ A Nữ", NameJa: "レディースAラインスカート", Price: 320000, ShippingCost: 25000, Description: "Chân váy chữ A vải tweed, thanh lịch nơi công sở", DescriptionJa: "ツイード生地Aラインスカート、オフィス向け", AttributeNames: models.StringSlice{"Size", "Color", "Length"}, ProductType: models.PRODUCT_TYPE_VIETNAMESE, DiscountPercent: 10},

	// ========== HÀNG NHẬT BẢN (ProductType = 1, giá Yên) ==========
	// Áo Nam Nhật
	{CategorySlug: "ao-nam", Name: "Uniqlo U Crew Neck T-Shirt", NameJa: "ユニクロU クルーネックTシャツ", Price: 1990, ShippingCost: 500, Description: "Áo thun Uniqlo U cao cấp, thiết kế tối giản Nhật Bản", DescriptionJa: "ユニクロUプレミアムTシャツ、ミニマルジャパンデザイン", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 0},
	{CategorySlug: "ao-nam", Name: "Muji Organic Cotton Shirt", NameJa: "無印良品 オーガニックコットンシャツ", Price: 3990, ShippingCost: 600, Description: "Áo sơ mi cotton hữu cơ Muji, thân thiện môi trường", DescriptionJa: "無印良品オーガニックコットンシャツ、環境に優しい", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 10},
	{CategorySlug: "ao-nam", Name: "GU Oversized Hoodie", NameJa: "GU オーバーサイズパーカー", Price: 2990, ShippingCost: 500, Description: "Áo hoodie oversize GU, phong cách streetwear Nhật", DescriptionJa: "GUオーバーサイズパーカー、ジャパンストリートスタイル", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 15},

	// Quần Nam Nhật
	{CategorySlug: "quan-nam", Name: "Uniqlo Smart Ankle Pants", NameJa: "ユニクロ スマートアンクルパンツ", Price: 3990, ShippingCost: 600, Description: "Quần ankle Uniqlo, thiết kế smart casual Nhật Bản", DescriptionJa: "ユニクロスマートアンクルパンツ、日本スマートカジュアル", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 0},
	{CategorySlug: "quan-nam", Name: "Muji Chino Pants", NameJa: "無印良品 チノパンツ", Price: 4990, ShippingCost: 600, Description: "Quần chino Muji, chất liệu cao cấp bền đẹp", DescriptionJa: "無印良品チノパンツ、高品質で長持ち", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 5},

	// Áo Nữ Nhật
	{CategorySlug: "ao-nu", Name: "Uniqlo Supima Cotton T-Shirt", NameJa: "ユニクロ スーピマコットンTシャツ", Price: 1500, ShippingCost: 500, Description: "Áo thun Supima cotton cao cấp, mềm mịn như lụa", DescriptionJa: "スーピマコットンTシャツ、シルクのような肌触り", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 0},
	{CategorySlug: "ao-nu", Name: "GU Ribbed Knit Top", NameJa: "GU リブニットトップス", Price: 1990, ShippingCost: 500, Description: "Áo len ribbed GU, phong cách casual Nhật Bản", DescriptionJa: "GUリブニットトップス、ジャパンカジュアルスタイル", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 20},
	{CategorySlug: "ao-nu", Name: "Muji Linen Blend Blouse", NameJa: "無印良品 リネンブレンドブラウス", Price: 3990, ShippingCost: 600, Description: "Áo blouse vải lanh pha Muji, thoáng mát mùa hè", DescriptionJa: "無印良品リネンブレンドブラウス、夏に最適", AttributeNames: models.StringSlice{"Size", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 0},

	// Quần Nữ Nhật
	{CategorySlug: "quan-nu", Name: "Uniqlo Wide Leg Pants", NameJa: "ユニクロ ワイドレッグパンツ", Price: 2990, ShippingCost: 600, Description: "Quần ống rộng Uniqlo, thoải mái và thời trang", DescriptionJa: "ユニクロワイドレッグパンツ、快適でファッショナブル", AttributeNames: models.StringSlice{"Waist", "Color"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 0},
	{CategorySlug: "quan-nu", Name: "GU High Waist Skirt", NameJa: "GU ハイウエストスカート", Price: 1990, ShippingCost: 500, Description: "Chân váy cạp cao GU, đơn giản thanh lịch", DescriptionJa: "GUハイウエストスカート、シンプルでエレガント", AttributeNames: models.StringSlice{"Size", "Color", "Length"}, ProductType: models.PRODUCT_TYPE_JAPANESE, DiscountPercent: 10},
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
			ID:              uuid.New().String(),
			CategoryID:      cat.ID,
			Name:            p.Name,
			NameJa:          p.NameJa,
			Slug:            slug,
			DefaultPrice:    p.Price,
			ShippingCost:    p.ShippingCost,
			Description:     p.Description,
			DescriptionJa:   p.DescriptionJa,
			Status:          models.PRODUCT_STATUS_ACTIVE,
			ProductType:     p.ProductType,
			AttributeNames:  p.AttributeNames,
			DiscountPercent: p.DiscountPercent,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created product: %s (type=%d)", slug, p.ProductType)
		res.Created++
	}
	return res, nil
}
