package seeder

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedVariant struct {
	ProductSlug string
	Attributes  json.RawMessage
	Price       float64
	Stock       int
}

// attr builds a JSONB attributes object from key-value pairs.
func attr(pairs ...string) json.RawMessage {
	m := make(map[string]string, len(pairs)/2)
	for i := 0; i+1 < len(pairs); i += 2 {
		m[pairs[i]] = pairs[i+1]
	}
	b, _ := json.Marshal(m)
	return b
}

var variants = []seedVariant{
	// ========== HÀNG VIỆT NAM (giá VNĐ) ==========

	// Áo Sơ Mi Trắng Nam Basic
	{ProductSlug: "ao-so-mi-trang-nam-basic", Attributes: attr("Size", "S", "Color", "#FFFFFF"), Price: 350000, Stock: 40},
	{ProductSlug: "ao-so-mi-trang-nam-basic", Attributes: attr("Size", "M", "Color", "#FFFFFF"), Price: 350000, Stock: 55},
	{ProductSlug: "ao-so-mi-trang-nam-basic", Attributes: attr("Size", "L", "Color", "#F5F5F5"), Price: 360000, Stock: 35},

	// Áo Thun Nam Cổ Tròn
	{ProductSlug: "ao-thun-nam-co-tron", Attributes: attr("Size", "S", "Color", "#000000", "Material", "Cotton 100%"), Price: 180000, Stock: 80},
	{ProductSlug: "ao-thun-nam-co-tron", Attributes: attr("Size", "M", "Color", "#1A1A2E", "Material", "Cotton 100%"), Price: 180000, Stock: 100},
	{ProductSlug: "ao-thun-nam-co-tron", Attributes: attr("Size", "XL", "Color", "#E8E8E8", "Material", "Cotton Blend"), Price: 190000, Stock: 60},

	// Áo Polo Nam Kẻ Sọc
	{ProductSlug: "ao-polo-nam-ke-soc", Attributes: attr("Size", "M", "Color", "#003366"), Price: 420000, Stock: 35},
	{ProductSlug: "ao-polo-nam-ke-soc", Attributes: attr("Size", "L", "Color", "#003366"), Price: 420000, Stock: 40},
	{ProductSlug: "ao-polo-nam-ke-soc", Attributes: attr("Size", "XL", "Color", "#8B0000"), Price: 430000, Stock: 25},

	// Quần Jean Nam Slim Fit
	{ProductSlug: "quan-jean-nam-slim-fit", Attributes: attr("Waist", "29", "Color", "#1C3D5A"), Price: 650000, Stock: 25},
	{ProductSlug: "quan-jean-nam-slim-fit", Attributes: attr("Waist", "30", "Color", "#1C3D5A"), Price: 650000, Stock: 30},
	{ProductSlug: "quan-jean-nam-slim-fit", Attributes: attr("Waist", "32", "Color", "#2E2E2E"), Price: 660000, Stock: 20},

	// Quần Tây Nam Công Sở
	{ProductSlug: "quan-tay-nam-cong-so", Attributes: attr("Waist", "29", "Color", "#2F2F2F"), Price: 550000, Stock: 20},
	{ProductSlug: "quan-tay-nam-cong-so", Attributes: attr("Waist", "30", "Color", "#4A4A4A"), Price: 550000, Stock: 25},
	{ProductSlug: "quan-tay-nam-cong-so", Attributes: attr("Waist", "32", "Color", "#1A1A1A"), Price: 560000, Stock: 15},

	// Quần Short Kaki Nam
	{ProductSlug: "quan-short-kaki-nam", Attributes: attr("Size", "M", "Color", "#C8A96E"), Price: 280000, Stock: 50},
	{ProductSlug: "quan-short-kaki-nam", Attributes: attr("Size", "L", "Color", "#8B7355"), Price: 280000, Stock: 60},
	{ProductSlug: "quan-short-kaki-nam", Attributes: attr("Size", "XL", "Color", "#556B2F"), Price: 290000, Stock: 40},

	// Áo Sơ Mi Nữ Tay Phồng
	{ProductSlug: "ao-so-mi-nu-tay-phong", Attributes: attr("Size", "S", "Color", "#FFFFFF"), Price: 380000, Stock: 40},
	{ProductSlug: "ao-so-mi-nu-tay-phong", Attributes: attr("Size", "M", "Color", "#FFC0CB"), Price: 380000, Stock: 50},
	{ProductSlug: "ao-so-mi-nu-tay-phong", Attributes: attr("Size", "L", "Color", "#E6E6FA"), Price: 390000, Stock: 30},

	// Áo Thun Nữ Crop Top
	{ProductSlug: "ao-thun-nu-crop-top", Attributes: attr("Size", "S", "Color", "#FF6B6B"), Price: 199000, Stock: 70},
	{ProductSlug: "ao-thun-nu-crop-top", Attributes: attr("Size", "M", "Color", "#4ECDC4"), Price: 199000, Stock: 80},
	{ProductSlug: "ao-thun-nu-crop-top", Attributes: attr("Size", "L", "Color", "#F7DC6F"), Price: 209000, Stock: 55},

	// Áo Kiểu Nữ Voan Hoa
	{ProductSlug: "ao-kieu-nu-voan-hoa", Attributes: attr("Size", "S", "Color", "#FFB6C1"), Price: 450000, Stock: 35},
	{ProductSlug: "ao-kieu-nu-voan-hoa", Attributes: attr("Size", "M", "Color", "#DDA0DD"), Price: 450000, Stock: 40},
	{ProductSlug: "ao-kieu-nu-voan-hoa", Attributes: attr("Size", "L", "Color", "#98FB98"), Price: 460000, Stock: 25},

	// Quần Jean Nữ Ống Rộng
	{ProductSlug: "quan-jean-nu-ong-rong", Attributes: attr("Waist", "26", "Color", "#4169E1"), Price: 620000, Stock: 20},
	{ProductSlug: "quan-jean-nu-ong-rong", Attributes: attr("Waist", "28", "Color", "#191970"), Price: 620000, Stock: 25},
	{ProductSlug: "quan-jean-nu-ong-rong", Attributes: attr("Waist", "30", "Color", "#708090"), Price: 630000, Stock: 15},

	// Quần Tây Nữ Lưng Cao
	{ProductSlug: "quan-tay-nu-lung-cao", Attributes: attr("Waist", "26", "Color", "#2F2F2F"), Price: 520000, Stock: 20},
	{ProductSlug: "quan-tay-nu-lung-cao", Attributes: attr("Waist", "28", "Color", "#FFFFF0"), Price: 520000, Stock: 25},
	{ProductSlug: "quan-tay-nu-lung-cao", Attributes: attr("Waist", "30", "Color", "#D2B48C"), Price: 530000, Stock: 15},

	// Chân Váy Chữ A Nữ
	{ProductSlug: "chan-vay-chu-a-nu", Attributes: attr("Size", "S", "Color", "#F5DEB3", "Length", "Mini"), Price: 320000, Stock: 30},
	{ProductSlug: "chan-vay-chu-a-nu", Attributes: attr("Size", "M", "Color", "#808080", "Length", "Midi"), Price: 320000, Stock: 35},
	{ProductSlug: "chan-vay-chu-a-nu", Attributes: attr("Size", "L", "Color", "#000000", "Length", "Maxi"), Price: 330000, Stock: 20},

	// ========== HÀNG NHẬT BẢN (giá Yên) ==========

	// Uniqlo U Crew Neck T-Shirt
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", Attributes: attr("Size", "S", "Color", "#FFFFFF"), Price: 1990, Stock: 50},
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", Attributes: attr("Size", "M", "Color", "#000000"), Price: 1990, Stock: 60},
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", Attributes: attr("Size", "L", "Color", "#808080"), Price: 1990, Stock: 45},
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", Attributes: attr("Size", "XL", "Color", "#1A1A1A"), Price: 2190, Stock: 30},

	// Muji Organic Cotton Shirt
	{ProductSlug: "muji-organic-cotton-shirt", Attributes: attr("Size", "S", "Color", "#FFFFFF"), Price: 3990, Stock: 30},
	{ProductSlug: "muji-organic-cotton-shirt", Attributes: attr("Size", "M", "Color", "#F5F5DC"), Price: 3990, Stock: 40},
	{ProductSlug: "muji-organic-cotton-shirt", Attributes: attr("Size", "L", "Color", "#87CEEB"), Price: 4190, Stock: 25},

	// GU Oversized Hoodie
	{ProductSlug: "gu-oversized-hoodie", Attributes: attr("Size", "M", "Color", "#2F2F2F"), Price: 2990, Stock: 45},
	{ProductSlug: "gu-oversized-hoodie", Attributes: attr("Size", "L", "Color", "#4A4A4A"), Price: 2990, Stock: 55},
	{ProductSlug: "gu-oversized-hoodie", Attributes: attr("Size", "XL", "Color", "#FFFFFF"), Price: 3190, Stock: 35},

	// Uniqlo Smart Ankle Pants
	{ProductSlug: "uniqlo-smart-ankle-pants", Attributes: attr("Waist", "28", "Color", "#2F2F2F"), Price: 3990, Stock: 30},
	{ProductSlug: "uniqlo-smart-ankle-pants", Attributes: attr("Waist", "30", "Color", "#1A1A1A"), Price: 3990, Stock: 40},
	{ProductSlug: "uniqlo-smart-ankle-pants", Attributes: attr("Waist", "32", "Color", "#4A4A4A"), Price: 3990, Stock: 35},

	// Muji Chino Pants
	{ProductSlug: "muji-chino-pants", Attributes: attr("Waist", "29", "Color", "#C8A96E"), Price: 4990, Stock: 25},
	{ProductSlug: "muji-chino-pants", Attributes: attr("Waist", "30", "Color", "#556B2F"), Price: 4990, Stock: 30},
	{ProductSlug: "muji-chino-pants", Attributes: attr("Waist", "32", "Color", "#2F2F2F"), Price: 5190, Stock: 20},

	// Uniqlo Supima Cotton T-Shirt
	{ProductSlug: "uniqlo-supima-cotton-t-shirt", Attributes: attr("Size", "S", "Color", "#FFFFFF"), Price: 1500, Stock: 60},
	{ProductSlug: "uniqlo-supima-cotton-t-shirt", Attributes: attr("Size", "M", "Color", "#FFC0CB"), Price: 1500, Stock: 70},
	{ProductSlug: "uniqlo-supima-cotton-t-shirt", Attributes: attr("Size", "L", "Color", "#E6E6FA"), Price: 1500, Stock: 50},

	// GU Ribbed Knit Top
	{ProductSlug: "gu-ribbed-knit-top", Attributes: attr("Size", "S", "Color", "#FFB6C1"), Price: 1990, Stock: 40},
	{ProductSlug: "gu-ribbed-knit-top", Attributes: attr("Size", "M", "Color", "#DDA0DD"), Price: 1990, Stock: 50},
	{ProductSlug: "gu-ribbed-knit-top", Attributes: attr("Size", "L", "Color", "#FFFFFF"), Price: 2190, Stock: 30},

	// Muji Linen Blend Blouse
	{ProductSlug: "muji-linen-blend-blouse", Attributes: attr("Size", "S", "Color", "#F5F5DC"), Price: 3990, Stock: 25},
	{ProductSlug: "muji-linen-blend-blouse", Attributes: attr("Size", "M", "Color", "#FFFFFF"), Price: 3990, Stock: 35},
	{ProductSlug: "muji-linen-blend-blouse", Attributes: attr("Size", "L", "Color", "#87CEEB"), Price: 4190, Stock: 20},

	// Uniqlo Wide Leg Pants
	{ProductSlug: "uniqlo-wide-leg-pants", Attributes: attr("Waist", "26", "Color", "#2F2F2F"), Price: 2990, Stock: 30},
	{ProductSlug: "uniqlo-wide-leg-pants", Attributes: attr("Waist", "28", "Color", "#F5F5DC"), Price: 2990, Stock: 40},
	{ProductSlug: "uniqlo-wide-leg-pants", Attributes: attr("Waist", "30", "Color", "#1A1A1A"), Price: 3190, Stock: 25},

	// GU High Waist Skirt
	{ProductSlug: "gu-high-waist-skirt", Attributes: attr("Size", "S", "Color", "#000000", "Length", "Mini"), Price: 1990, Stock: 35},
	{ProductSlug: "gu-high-waist-skirt", Attributes: attr("Size", "M", "Color", "#2F2F2F", "Length", "Midi"), Price: 1990, Stock: 45},
	{ProductSlug: "gu-high-waist-skirt", Attributes: attr("Size", "L", "Color", "#F5F5DC", "Length", "Midi"), Price: 2190, Stock: 25},
}

// SeedProductVariants inserts variants for each product; skips products that already have variants.
// Must run after SeedProducts.
func SeedProductVariants(db *gorm.DB) (Result, error) {
	res := Result{}

	// Group variants by product slug to batch-check and batch-insert.
	bySlug := make(map[string][]seedVariant)
	for _, v := range variants {
		bySlug[v.ProductSlug] = append(bySlug[v.ProductSlug], v)
	}

	for slug, svs := range bySlug {
		var product models.Product
		err := db.Where("slug = ? AND deleted_at IS NULL", slug).First(&product).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("  skip variants (product missing): %s", slug)
				res.Skipped += len(svs)
				continue
			}
			return res, err
		}

		var count int64
		if err := db.Model(&models.ProductVariant{}).Where("product_id = ?", product.ID).Count(&count).Error; err != nil {
			return res, err
		}
		if count > 0 {
			log.Printf("  skip variants (exists): %s (%d variants)", slug, count)
			res.Skipped += len(svs)
			continue
		}

		rows := make([]models.ProductVariant, 0, len(svs))
		for _, sv := range svs {
			rows = append(rows, models.ProductVariant{
				ID:         uuid.New().String(),
				ProductID:  product.ID,
				Attributes: sv.Attributes,
				Price:      sv.Price,
				Stock:      sv.Stock,
				Sold:       0,
				Status:     models.VARIANT_STATUS_ACTIVE,
			})
		}
		if err := db.Create(&rows).Error; err != nil {
			return res, err
		}
		log.Printf("  created variants: %s (%d)", slug, len(rows))
		res.Created += len(rows)
	}
	return res, nil
}
