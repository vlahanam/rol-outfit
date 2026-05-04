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
	Data         json.RawMessage
}

// Per-product variant data: each entry is an array of {id, size, color, price}.
var dataAoSoMiTrangNamBasic = json.RawMessage(`[{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567801","size":"S","color":"#FFFFFF","price":"350000"},{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567802","size":"M","color":"#FFFFFF","price":"350000"},{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567803","size":"L","color":"#F5F5F5","price":"360000"}]`)
var dataAoThunNamCoTron = json.RawMessage(`[{"id":"b2c3d4e5-f6a7-8901-bcde-f12345678901","size":"S","color":"#000000","width":"100","price":"180000"},{"id":"b2c3d4e5-f6a7-8901-bcde-f12345678902","size":"M","color":"#1A1A2E","width":"100","price":"180000"},{"id":"b2c3d4e5-f6a7-8901-bcde-f12345678903","size":"XL","color":"#E8E8E8","price":"190000"}]`)
var dataAoPoloNamKeSoc = json.RawMessage(`[{"id":"c3d4e5f6-a7b8-9012-cdef-123456789001","size":"M","color":"#003366","price":"420000"},{"id":"c3d4e5f6-a7b8-9012-cdef-123456789002","size":"L","color":"#003366","price":"420000"},{"id":"c3d4e5f6-a7b8-9012-cdef-123456789003","size":"XL","color":"#8B0000","price":"430000"}]`)
var dataQuanJeanNamSlimFit = json.RawMessage(`[{"id":"d4e5f6a7-b8c9-0123-defa-234567890101","size":"29","color":"#1C3D5A","price":"650000"},{"id":"d4e5f6a7-b8c9-0123-defa-234567890102","size":"30","color":"#1C3D5A","price":"650000"},{"id":"d4e5f6a7-b8c9-0123-defa-234567890103","size":"32","color":"#2E2E2E","price":"660000"}]`)
var dataQuanTayNamCongSo = json.RawMessage(`[{"id":"e5f6a7b8-c9d0-1234-efab-345678901201","size":"29","color":"#2F2F2F","price":"550000"},{"id":"e5f6a7b8-c9d0-1234-efab-345678901202","size":"30","color":"#4A4A4A","price":"550000"},{"id":"e5f6a7b8-c9d0-1234-efab-345678901203","size":"32","color":"#1A1A1A","price":"560000"}]`)
var dataQuanShortKakiNam = json.RawMessage(`[{"id":"f6a7b8c9-d0e1-2345-fabc-456789012301","size":"M","color":"#C8A96E","price":"280000"},{"id":"f6a7b8c9-d0e1-2345-fabc-456789012302","size":"L","color":"#8B7355","price":"280000"},{"id":"f6a7b8c9-d0e1-2345-fabc-456789012303","size":"XL","color":"#556B2F","price":"290000"}]`)
var dataAoSoMiNuTayPhong = json.RawMessage(`[{"id":"a7b8c9d0-e1f2-3456-abcd-567890123401","size":"S","color":"#FFFFFF","price":"380000"},{"id":"a7b8c9d0-e1f2-3456-abcd-567890123402","size":"M","color":"#FFC0CB","price":"380000"},{"id":"a7b8c9d0-e1f2-3456-abcd-567890123403","size":"L","color":"#E6E6FA","price":"390000"}]`)
var dataAoThunNuCropTop = json.RawMessage(`[{"id":"b8c9d0e1-f2a3-4567-bcde-678901234501","size":"S","color":"#FF6B6B","price":"199000"},{"id":"b8c9d0e1-f2a3-4567-bcde-678901234502","size":"M","color":"#4ECDC4","price":"199000"},{"id":"b8c9d0e1-f2a3-4567-bcde-678901234503","size":"L","color":"#F7DC6F","price":"209000"}]`)
var dataAoKieuNuVoanHoa = json.RawMessage(`[{"id":"c9d0e1f2-a3b4-5678-cdef-789012345601","size":"S","color":"#FFB6C1","price":"450000"},{"id":"c9d0e1f2-a3b4-5678-cdef-789012345602","size":"M","color":"#DDA0DD","price":"450000"},{"id":"c9d0e1f2-a3b4-5678-cdef-789012345603","size":"L","color":"#98FB98","price":"460000"}]`)
var dataQuanJeanNuOngRong = json.RawMessage(`[{"id":"d0e1f2a3-b4c5-6789-defa-890123456701","size":"26","color":"#4169E1","price":"620000"},{"id":"d0e1f2a3-b4c5-6789-defa-890123456702","size":"28","color":"#191970","price":"620000"},{"id":"d0e1f2a3-b4c5-6789-defa-890123456703","size":"30","color":"#708090","price":"630000"}]`)
var dataQuanTayNuLungCao = json.RawMessage(`[{"id":"e1f2a3b4-c5d6-7890-efab-901234567801","size":"26","color":"#2F2F2F","price":"520000"},{"id":"e1f2a3b4-c5d6-7890-efab-901234567802","size":"28","color":"#FFFFF0","price":"520000"},{"id":"e1f2a3b4-c5d6-7890-efab-901234567803","size":"30","color":"#D2B48C","price":"530000"}]`)
var dataChanVayChuANu = json.RawMessage(`[{"id":"f2a3b4c5-d6e7-8901-fabc-012345678901","size":"S","color":"#F5DEB3","price":"320000"},{"id":"f2a3b4c5-d6e7-8901-fabc-012345678902","size":"M","color":"#808080","price":"320000"},{"id":"f2a3b4c5-d6e7-8901-fabc-012345678903","size":"L","color":"#000000","price":"330000"}]`)

// 3 products per category = 12 total. Prices in VND, range 150k–850k.
var products = []seedProduct{
	// Áo Nam
	{CategorySlug: "ao-nam", Name: "Áo Sơ Mi Trắng Nam Basic", Price: 350000, Description: "Áo sơ mi cotton trắng, form regular fit", Data: dataAoSoMiTrangNamBasic},
	{CategorySlug: "ao-nam", Name: "Áo Thun Nam Cổ Tròn", Price: 180000, Description: "Áo thun cotton 100%, thoáng mát", Data: dataAoThunNamCoTron},
	{CategorySlug: "ao-nam", Name: "Áo Polo Nam Kẻ Sọc", Price: 420000, Description: "Áo polo phối kẻ, lịch sự năng động", Data: dataAoPoloNamKeSoc},
	// Quần Nam
	{CategorySlug: "quan-nam", Name: "Quần Jean Nam Slim Fit", Price: 650000, Description: "Quần jean slim, chất denim co giãn", Data: dataQuanJeanNamSlimFit},
	{CategorySlug: "quan-nam", Name: "Quần Tây Nam Công Sở", Price: 550000, Description: "Quần tây vải tuytsi, dáng straight", Data: dataQuanTayNamCongSo},
	{CategorySlug: "quan-nam", Name: "Quần Short Kaki Nam", Price: 280000, Description: "Quần short kaki mùa hè", Data: dataQuanShortKakiNam},
	// Áo Nữ
	{CategorySlug: "ao-nu", Name: "Áo Sơ Mi Nữ Tay Phồng", Price: 380000, Description: "Áo sơ mi tay bồng phong cách Hàn", Data: dataAoSoMiNuTayPhong},
	{CategorySlug: "ao-nu", Name: "Áo Thun Nữ Crop Top", Price: 199000, Description: "Áo crop top trẻ trung", Data: dataAoThunNuCropTop},
	{CategorySlug: "ao-nu", Name: "Áo Kiểu Nữ Voan Hoa", Price: 450000, Description: "Áo voan họa tiết hoa nhí", Data: dataAoKieuNuVoanHoa},
	// Quần Nữ
	{CategorySlug: "quan-nu", Name: "Quần Jean Nữ Ống Rộng", Price: 620000, Description: "Quần jean ống suông cá tính", Data: dataQuanJeanNuOngRong},
	{CategorySlug: "quan-nu", Name: "Quần Tây Nữ Lưng Cao", Price: 520000, Description: "Quần tây cạp cao thanh lịch", Data: dataQuanTayNuLungCao},
	{CategorySlug: "quan-nu", Name: "Chân Váy Chữ A Nữ", Price: 320000, Description: "Chân váy chữ A vải tweed", Data: dataChanVayChuANu},
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
			ID:           uuid.New().String(),
			CategoryID:   cat.ID,
			Name:         p.Name,
			Slug:         slug,
			DefaultPrice: p.Price,
			Description:  p.Description,
			Status:       models.PRODUCT_STATUS_ACTIVE,
			Data:         p.Data,
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
