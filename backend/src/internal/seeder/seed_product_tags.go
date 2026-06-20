package seeder

import (
	"errors"
	"log"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedProductTag struct {
	ProductSlug string
	TagSlug     string
}

var productTags = []seedProductTag{
	// ========== Hàng mới (new arrivals) ==========
	// Vietnamese products
	{ProductSlug: "ao-so-mi-trang-nam-basic", TagSlug: "hang-moi"},
	{ProductSlug: "ao-so-mi-nu-tay-phong", TagSlug: "hang-moi"},
	{ProductSlug: "quan-jean-nam-slim-fit", TagSlug: "hang-moi"},
	{ProductSlug: "quan-jean-nu-ong-rong", TagSlug: "hang-moi"},
	{ProductSlug: "ao-thun-nu-crop-top", TagSlug: "hang-moi"},
	{ProductSlug: "ao-polo-nam-ke-soc", TagSlug: "hang-moi"},
	// Japanese products
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", TagSlug: "hang-moi"},
	{ProductSlug: "muji-organic-cotton-shirt", TagSlug: "hang-moi"},
	{ProductSlug: "gu-oversized-hoodie", TagSlug: "hang-moi"},
	{ProductSlug: "uniqlo-supima-cotton-t-shirt", TagSlug: "hang-moi"},

	// ========== Bán chạy (best sellers) ==========
	// Vietnamese products
	{ProductSlug: "ao-thun-nam-co-tron", TagSlug: "ban-chay"},
	{ProductSlug: "quan-tay-nam-cong-so", TagSlug: "ban-chay"},
	{ProductSlug: "ao-kieu-nu-voan-hoa", TagSlug: "ban-chay"},
	{ProductSlug: "quan-tay-nu-lung-cao", TagSlug: "ban-chay"},
	// Japanese products
	{ProductSlug: "uniqlo-smart-ankle-pants", TagSlug: "ban-chay"},
	{ProductSlug: "muji-chino-pants", TagSlug: "ban-chay"},
	{ProductSlug: "gu-ribbed-knit-top", TagSlug: "ban-chay"},

	// ========== Hot ==========
	// Vietnamese products
	{ProductSlug: "ao-so-mi-trang-nam-basic", TagSlug: "hot"},
	{ProductSlug: "quan-jean-nu-ong-rong", TagSlug: "hot"},
	{ProductSlug: "ao-thun-nu-crop-top", TagSlug: "hot"},
	// Japanese products
	{ProductSlug: "uniqlo-u-crew-neck-t-shirt", TagSlug: "hot"},
	{ProductSlug: "gu-oversized-hoodie", TagSlug: "hot"},
	{ProductSlug: "uniqlo-wide-leg-pants", TagSlug: "hot"},

	// ========== Limited ==========
	// Vietnamese products
	{ProductSlug: "chan-vay-chu-a-nu", TagSlug: "limited"},
	{ProductSlug: "quan-short-kaki-nam", TagSlug: "limited"},
	// Japanese products
	{ProductSlug: "muji-linen-blend-blouse", TagSlug: "limited"},
	{ProductSlug: "gu-high-waist-skirt", TagSlug: "limited"},
}

func SeedProductTags(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, pt := range productTags {
		var product models.Product
		if err := db.Where("slug = ? AND deleted_at IS NULL", pt.ProductSlug).First(&product).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("  skip product_tag (product missing): %s", pt.ProductSlug)
				res.Skipped++
				continue
			}
			return res, err
		}

		var tag models.Tag
		if err := db.Where("slug = ?", pt.TagSlug).First(&tag).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("  skip product_tag (tag missing): %s", pt.TagSlug)
				res.Skipped++
				continue
			}
			return res, err
		}

		var existing models.ProductTag
		err := db.Where("product_id = ? AND tag_id = ?", product.ID, tag.ID).First(&existing).Error
		if err == nil {
			log.Printf("  skip product_tag (exists): %s -> %s", pt.ProductSlug, pt.TagSlug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		row := models.ProductTag{
			ProductID: product.ID,
			TagID:     tag.ID,
			CreatedAt: time.Now(),
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created product_tag: %s -> %s", pt.ProductSlug, pt.TagSlug)
		res.Created++
	}
	return res, nil
}
