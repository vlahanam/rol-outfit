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

// RunAll runs all seeders in dependency order: users -> categories -> products.
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

	prodsRes, err := SeedProducts(db)
	if err != nil {
		return err
	}
	log.Printf("[products] tạo mới: %d, bỏ qua: %d", prodsRes.Created, prodsRes.Skipped)

	widgetsRes, err := SeedWidgets(db)
	if err != nil {
		return err
	}
	log.Printf("[widgets] tạo mới: %d, bỏ qua: %d", widgetsRes.Created, widgetsRes.Skipped)

	log.Println("=== seed kết thúc ===")
	return nil
}
