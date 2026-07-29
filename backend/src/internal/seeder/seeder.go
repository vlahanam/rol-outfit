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

	tagsRes, err := SeedTags(db)
	if err != nil {
		return err
	}
	log.Printf("[tags] tạo mới: %d, bỏ qua: %d", tagsRes.Created, tagsRes.Skipped)

	widgetsRes, err := SeedWidgets(db)
	if err != nil {
		return err
	}
	log.Printf("[widgets] tạo mới: %d, bỏ qua: %d", widgetsRes.Created, widgetsRes.Skipped)

	log.Println("=== seed kết thúc ===")
	return nil
}
