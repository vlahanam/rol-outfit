---
phase: 1
title: Implement Seeders
status: pending
---

# Phase 1: Implement Seeders

## Steps

1. **seed_products.go** — remove `Data` field from all `row` assignments; keep var declarations as documentation reference or delete them
2. **seed_product_variants.go** — define `seedVariant` struct, map product slug → []variant, implement `SeedProductVariants`
3. **seeder.go** — add `SeedProductVariants` call after `SeedProducts`

## seedVariant struct

```go
type seedVariant struct {
    ProductSlug string
    Attributes  json.RawMessage
    Price       float64
    Stock       int
}
```

## Variant data design

Each product has 3 variants. Attribute keys differ per product type:
- Áo (shirts/tops): `{"Size":"S/M/L/XL", "Color":"#hex"}`
- Áo Thun Nam Cổ Tròn: `{"Size":"...", "Color":"...", "Material":"Cotton 100%/Cotton Blend"}`
- Quần (pants): `{"Waist":"29/30/32 or 26/28/30", "Color":"#hex"}`
- Chân Váy Chữ A: `{"Size":"S/M/L", "Color":"#hex", "Length":"Mini/Midi/Maxi"}`

## SeedProductVariants logic

```
for each seedVariant:
  1. Find product by slug → if not found, skip
  2. Check if any variant exists for that product_id → if yes, skip all
  3. Batch insert all 3 variants for that product
```

Skip check: `SELECT COUNT(*) FROM product_variants WHERE product_id = ?` > 0 → skip

## Todo

- [ ] Remove Data field from seed_products.go rows
- [ ] Remove unused var declarations (dataXxx vars)
- [ ] Create seed_product_variants.go
- [ ] Update seeder.go
- [ ] go build ./... — verify clean compile
