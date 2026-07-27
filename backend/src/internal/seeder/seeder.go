package seeder

import (
	"log"

	"gorm.io/gorm"
)

// Result tracks created vs skipped counts per entity.
type Result struct {
	Created int
	Skipped int
}

// RunAll runs all seeders in dependency order.
func RunAll(db *gorm.DB) error {
	log.Println("=== bắt đầu seed dữ liệu ===")

	usersRes, err := SeedUsers(db)
	if err != nil {
		return err
	}
	log.Printf("[users] tạo mới: %d, bỏ qua: %d", usersRes.Created, usersRes.Skipped)

	catsRes, err := SeedCategories(db)
	if err != nil {
		return err
	}
	log.Printf("[categories] tạo mới: %d, bỏ qua: %d", catsRes.Created, catsRes.Skipped)

	tagsRes, err := SeedTags(db)
	if err != nil {
		return err
	}
	log.Printf("[tags] tạo mới: %d, bỏ qua: %d", tagsRes.Created, tagsRes.Skipped)

	prodsRes, err := SeedProducts(db)
	if err != nil {
		return err
	}
	log.Printf("[products] tạo mới: %d, bỏ qua: %d", prodsRes.Created, prodsRes.Skipped)

	variantsRes, err := SeedProductVariants(db)
	if err != nil {
		return err
	}
	log.Printf("[product_variants] tạo mới: %d, bỏ qua: %d", variantsRes.Created, variantsRes.Skipped)

	productTagsRes, err := SeedProductTags(db)
	if err != nil {
		return err
	}
	log.Printf("[product_tags] tạo mới: %d, bỏ qua: %d", productTagsRes.Created, productTagsRes.Skipped)

	widgetsRes, err := SeedWidgets(db)
	if err != nil {
		return err
	}
	log.Printf("[widgets] tạo mới: %d, bỏ qua: %d", widgetsRes.Created, widgetsRes.Skipped)

	log.Println("=== seed kết thúc ===")
	return nil
}
