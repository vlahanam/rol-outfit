package seeder

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedWidget struct {
	Name         string
	Type         string
	DisplayOrder int
	Depth        int
	Status       int8
	ParentName   string // tên widget cha, rỗng nếu là gốc
	Settings     map[string]any
}

// Cây widget mẫu: 2 container gốc, mỗi container có 2 widget con.
var widgets = []seedWidget{
	// Cấp 0 — container gốc
	{Name: "Bộ Sưu Tập Đặc Biệt", Type: "container", DisplayOrder: 1, Depth: 0, Status: 2},
	{Name: "Xu Hướng Hot", Type: "container", DisplayOrder: 2, Depth: 0, Status: 2},

	// Con của "Bộ Sưu Tập Đặc Biệt"
	{Name: "Thời Trang Công Sở", Type: "image", DisplayOrder: 1, Depth: 1, ParentName: "Bộ Sưu Tập Đặc Biệt", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Phụ Kiện", Type: "image", DisplayOrder: 2, Depth: 1, ParentName: "Bộ Sưu Tập Đặc Biệt", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Thời Trang Nữ", Type: "image", DisplayOrder: 3, Depth: 1, ParentName: "Bộ Sưu Tập Đặc Biệt", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Giày Thể Thao", Type: "image", DisplayOrder: 4, Depth: 1, ParentName: "Bộ Sưu Tập Đặc Biệt", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},

	// Con của "Xu Hướng Hot"
	{Name: "Bộ Sưu Tập Thu Gradient", Type: "image", DisplayOrder: 1, Depth: 1, ParentName: "Xu Hướng Hot", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Phong Cách Halloween", Type: "image", DisplayOrder: 2, Depth: 1, ParentName: "Xu Hướng Hot", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Quần Jeans Xanh Chính Hiệu", Type: "image", DisplayOrder: 3, Depth: 1, ParentName: "Xu Hướng Hot", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
	{Name: "Quần Jeans Công Sở", Type: "image", DisplayOrder: 4, Depth: 1, ParentName: "Xu Hướng Hot", Settings: map[string]any{"url_image": "", "link": ""}, Status: 2},
}

// SeedWidgets inserts sample widgets; skips by matching name + depth.
func SeedWidgets(db *gorm.DB) (Result, error) {
	res := Result{}

	// map name -> ID để resolve parent
	nameToID := map[string]string{}

	for _, w := range widgets {
		var existing models.Widget
		err := db.Where("name = ? AND depth = ?", w.Name, w.Depth).First(&existing).Error
		if err == nil {
			log.Printf("  skip widget (exists): %s", w.Name)
			nameToID[w.Name] = existing.ID
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		settings, _ := json.Marshal(w.Settings)

		row := models.Widget{
			ID:           uuid.New().String(),
			Name:         w.Name,
			Type:         w.Type,
			DisplayOrder: w.DisplayOrder,
			Depth:        w.Depth,
			Status:       w.Status,
			Settings:     json.RawMessage(settings),
		}

		if w.ParentName != "" {
			parentID, ok := nameToID[w.ParentName]
			if !ok {
				log.Printf("  skip widget (parent missing): %s -> %s", w.Name, w.ParentName)
				res.Skipped++
				continue
			}
			row.ParentID = &parentID
		}

		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		nameToID[w.Name] = row.ID
		log.Printf("  created widget: %s", w.Name)
		res.Created++
	}
	return res, nil
}
