---
title: Product schema - replace data JSONB with attribute_names TEXT[]
status: completed
priority: high
created: 2026-05-06
blockedBy: []
blocks: []
---

# Product Schema Change: data → attribute_names

## Schema Diff

```
- data          JSONB          (removed)
+ attribute_names TEXT[] NOT NULL DEFAULT '{}'  (added)
```

`attribute_names` stores the list of variant attribute keys for a product, e.g. `{"Size","Color","Material"}`.

## Approach: Custom StringSlice type

No new dependencies. Define `StringSlice` in `models/` implementing `driver.Valuer` + `sql.Scanner`
for PostgreSQL `TEXT[]` format `{elem1,elem2}`.

## Files to Change

| File | Change |
|------|--------|
| `models/product.go` | `Data json.RawMessage` → `AttributeNames StringSlice`; add StringSlice type |
| `dto/product_dto.go` | `Data json.RawMessage` → `AttributeNames []string` |
| `requests/product_request.go` | `Data json.RawMessage` → `AttributeNames []string` (optional on create/update) |
| `services/product_service.go` | Update Create/Update to use AttributeNames |
| `seeder/seed_products.go` | Add AttributeNames to each product |

## Seeder attribute_names per product

| Slug | AttributeNames |
|------|---------------|
| ao-so-mi-trang-nam-basic | [Size, Color] |
| ao-thun-nam-co-tron | [Size, Color, Material] |
| ao-polo-nam-ke-soc | [Size, Color] |
| quan-jean-nam-slim-fit | [Waist, Color] |
| quan-tay-nam-cong-so | [Waist, Color] |
| quan-short-kaki-nam | [Size, Color] |
| ao-so-mi-nu-tay-phong | [Size, Color] |
| ao-thun-nu-crop-top | [Size, Color] |
| ao-kieu-nu-voan-hoa | [Size, Color] |
| quan-jean-nu-ong-rong | [Waist, Color] |
| quan-tay-nu-lung-cao | [Waist, Color] |
| chan-vay-chu-a-nu | [Size, Color, Length] |
