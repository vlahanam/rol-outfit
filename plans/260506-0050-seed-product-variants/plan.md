---
title: Seed Product Variants
status: completed
priority: medium
created: 2026-05-06
blockedBy: []
blocks: []
---

# Seed Product Variants

Cập nhật seeder để:
1. Xóa trường `Data` khỏi `seed_products.go` (variant data đã có bảng riêng)
2. Thêm `seed_product_variants.go` — tạo variants cho từng sản phẩm với attribute và stock khác nhau
3. Cập nhật `seeder.go` — gọi `SeedProductVariants` sau `SeedProducts`

## Phân tích Product Attribute Sets

| Sản phẩm | Attributes | Stock/variant |
|----------|-----------|---------------|
| Áo Sơ Mi Trắng Nam Basic | Size, Color | 40 |
| Áo Thun Nam Cổ Tròn | Size, Color, Material | 80 |
| Áo Polo Nam Kẻ Sọc | Size, Color | 35 |
| Quần Jean Nam Slim Fit | Waist, Color | 25 |
| Quần Tây Nam Công Sở | Waist, Color | 20 |
| Quần Short Kaki Nam | Size, Color | 50 |
| Áo Sơ Mi Nữ Tay Phồng | Size, Color | 40 |
| Áo Thun Nữ Crop Top | Size, Color | 70 |
| Áo Kiểu Nữ Voan Hoa | Size, Color | 35 |
| Quần Jean Nữ Ống Rộng | Waist, Color | 20 |
| Quần Tây Nữ Lưng Cao | Waist, Color | 20 |
| Chân Váy Chữ A Nữ | Size, Color, Length | 30 |

→ 4 attribute sets khác nhau: `{Size, Color}`, `{Size, Color, Material}`, `{Waist, Color}`, `{Size, Color, Length}`

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Implement Seeders](./phase-01-implement.md) | pending |

## Key Files

**Modify:**
- `backend/src/internal/seeder/seed_products.go` — xóa trường `Data`
- `backend/src/internal/seeder/seeder.go` — thêm `SeedProductVariants`

**Create:**
- `backend/src/internal/seeder/seed_product_variants.go`
