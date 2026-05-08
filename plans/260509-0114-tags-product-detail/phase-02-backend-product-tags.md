# Phase 02 — Backend: Product-Tags Junction & Assignment

## Context Links
- Depends on: Phase 01 (tags table)
- Product layer references: `backend/src/internal/{models,repositories,services,controllers,dto}/product*.go`
- Existing public product GET: `controllers.GetProduct(db)`
- Existing admin product GET: `controllers.AdminGetProduct(db)`

## Overview
- **Priority:** P2 (unblocks Phases 04 + 05)
- **Status:** pending
- **Effort:** 2h
- **Description:** Create `product_tags` junction table, atomic replace-set assignment endpoint (max 3 tags), and extend product GET responses to include their active tags.

## Key Insights
- **Replace-set semantics** (PUT with full list) is simpler than separate add/remove endpoints — fewer races, idempotent. Phase 02 implements ONLY `PUT /products/:id/tags`.
- Junction has no surrogate ID — composite PK `(product_id, tag_id)`.
- The 3-tag cap is enforced at SERVICE layer (returns `ErrTooManyTags`); DB has no constraint (kept simple, allows future override).
- `FK ON DELETE CASCADE` on both columns — deleting a tag or product cleans junction automatically.
- Public product GET joins active tags inline; admin product GET returns ALL assigned tags (so admin can see/manage assignments to inactive tags).

## Requirements

### Functional
- `PUT /api/v1/products/:id/tags` (admin) — body `{ "tag_ids": ["uuid", ...] }` — replaces full set
- Public `GET /api/v1/products/:id` response shape gains `"tags": [TagDTO]` (active only)
- Admin `GET /api/v1/admin/products/:id` response shape gains `"tags": [TagDTO]` (all assigned)
- Validation: `len(tag_ids) <= 3`, each ID must exist in `tags` table

### Non-Functional
- Replace operation runs in single transaction
- No N+1: tags fetched in one query per request via `IN (?)` join

## Architecture

### Migration `000012_create_product_tags`

```sql
-- up
CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     UUID        NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_tag     ON product_tags (tag_id);
CREATE INDEX idx_product_tags_product ON product_tags (product_id);

-- down
DROP TABLE IF EXISTS product_tags;
```

### Model `models/product_tag.go`

```go
type ProductTag struct {
    ProductID string    `gorm:"type:uuid;primaryKey;column:product_id"`
    TagID     string    `gorm:"type:uuid;primaryKey;column:tag_id"`
    CreatedAt time.Time `gorm:"column:created_at"`
}
func (ProductTag) TableName() string { return "product_tags" }
```

### Repository `repositories/product_tag_repo.go`

Interface methods:
- `ReplaceProductTags(ctx, productID, tagIDs []string) error` — uses `db.Transaction`: DELETE all by product_id, batch INSERT new rows
- `FindActiveTagsByProductID(ctx, productID, now)` — JOIN active filter, returns `[]*models.Tag`
- `FindAllTagsByProductID(ctx, productID)` — admin variant, no window filter
- `FindActiveTagsByProductIDs(ctx, ids []string, now)` — batch loader returning `map[productID][]*Tag` (used by future list endpoints if needed; YAGNI for now — implement only when Phase 05 requires it for related-products. Skip if shop list still doesn't show tags.)

### Service `services/product_tag_service.go`

```go
var (
    ErrTooManyTags     = errors.New("max 3 tags per product")
    ErrTagDoesNotExist = errors.New("one or more tag ids do not exist")
)

type ProductTagService interface {
    Assign(ctx context.Context, productID string, tagIDs []string) error
    GetActiveTags(ctx context.Context, productID string) ([]*models.Tag, error)
    GetAllTags(ctx context.Context, productID string) ([]*models.Tag, error)
}
```

`Assign` flow:
1. If `len(tagIDs) > 3` → `ErrTooManyTags`
2. Dedupe input (defensive)
3. If non-empty, verify all exist via `tagRepo.FindTagsByIDs(ids)` (add this method to tag_repo as part of Phase 02 — does not break Phase 01 since it's new)
4. Verify product exists (use existing `productRepo.FindProductByIDNoFilter`)
5. Call `repo.ReplaceProductTags`

### Controller `controllers/product_tag_controller.go`

Single handler:
```
PUT /products/:id/tags  (admin)  → AssignProductTags(db)
```
- 200 on success (or 204; pick 204 to match category pattern)
- 400 on `ErrTooManyTags`
- 404 on product or tag missing
- i18n keys: `error.too_many_tags`, `error.product_not_found`, `error.tag_not_found`

### Request `requests/product_tag_request.go`

```go
type AssignProductTagsRequest struct {
    TagIDs []string `json:"tag_ids"`
}
func (r AssignProductTagsRequest) Validate() error {
    return validation.ValidateStruct(&r,
        validation.Field(&r.TagIDs, validation.Length(0, 3).Error("validation.tags.max_3")),
    )
}
```

### Extending product responses

#### Public GET `/products/:id`
Modify `services.ProductService.GetByID` (existing) → after fetching product, call `productTagService.GetActiveTags(productID)` → attach to a new combined DTO.

Add to `dto/product_dto.go`:
```go
type ProductDetailDTO struct {
    *ProductDTO
    Tags []*TagDTO `json:"tags"`
}
```
Use `ToProductDetailDTO(p *Product, tags []*Tag)` in controller.

#### Admin GET `/admin/products/:id`
Extend `ProductWithVariantsDTO` to include `Tags []*TagDTO`. Update `ToProductWithVariantsDTO` signature to accept tags slice (or attach in controller after construction).

Controller change pattern (minimal):
```go
// in GetProduct controller
product, _ := productSvc.GetByID(ctx, id)
tags, _ := tagAssignSvc.GetActiveTags(ctx, id)
return ctx.JSON(common.ResponseData(dto.ToProductDetailDTO(product, tags)))
```

### Routes (route.go addition)

```go
// Product tag assignment (admin) — nested under products
adminProds.Put("/:id/tags", controllers.AssignProductTags(db))
```
Place inside the existing `adminProds` group. Owner of this single line addition is Phase 02.

### i18n locale additions

```
"error.too_many_tags": "Mỗi sản phẩm chỉ có tối đa 3 thẻ tag" / "1商品につき最大3タグまで"
"validation.tags.max_3": "Tối đa 3 thẻ tag"        / "最大3タグ"
```

## Related Code Files

### Create
- `backend/database/migrations/000012_create_product_tags.up.sql`
- `backend/database/migrations/000012_create_product_tags.down.sql`
- `backend/src/internal/models/product_tag.go`
- `backend/src/internal/repositories/product_tag_repo.go`
- `backend/src/internal/services/product_tag_service.go`
- `backend/src/internal/controllers/product_tag_controller.go`
- `backend/src/internal/requests/product_tag_request.go`

### Modify
- `backend/src/internal/repositories/tag_repo.go` (add `FindTagsByIDs(ids)`)
- `backend/src/internal/dto/product_dto.go` (add `ProductDetailDTO`, extend `ProductWithVariantsDTO` with `Tags`)
- `backend/src/internal/controllers/product_controller.go` (inject tag fetch into `GetProduct` and `AdminGetProduct`)
- `backend/src/internal/initialize/route.go` (add 1 line: `adminProds.Put("/:id/tags", ...)`)
- `backend/src/internal/i18n/locales/{vi,ja}.json`

## Implementation Steps

1. Write migration pair `000012_create_product_tags.{up,down}.sql`
2. Create `models/product_tag.go`
3. Add `FindTagsByIDs` method to `tag_repo.go`
4. Create `repositories/product_tag_repo.go` with `ReplaceProductTags` (transactional), `FindActiveTagsByProductID`, `FindAllTagsByProductID`
5. Create `requests/product_tag_request.go`
6. Create `services/product_tag_service.go`
7. Create `controllers/product_tag_controller.go` with `AssignProductTags` handler
8. Add `ProductDetailDTO` + `Tags` field on `ProductWithVariantsDTO` in `dto/product_dto.go`
9. Modify `controllers/product_controller.go` `GetProduct` and `AdminGetProduct` to attach tags
10. Add i18n keys
11. Register the assign route
12. `make rebuild`; smoke test:
   - PUT 4 tags → 400
   - PUT 3 valid tags → 204; GET product → 3 tags returned
   - PUT [] → 204; GET product → empty tags
   - PUT non-existent tag → 404

## Todo List

- [ ] Migration files written
- [ ] `models/product_tag.go` created
- [ ] `tag_repo.go` extended with `FindTagsByIDs`
- [ ] `product_tag_repo.go` with transactional ReplaceProductTags
- [ ] `product_tag_service.go` with all guards
- [ ] `product_tag_controller.go` (single handler)
- [ ] `product_dto.go` extended (no breaking field renames)
- [ ] `product_controller.go` GetProduct + AdminGetProduct now attach tags
- [ ] Route registered in `route.go`
- [ ] i18n keys added
- [ ] `go build` passes
- [ ] `make rebuild` migrates cleanly
- [ ] Manual curl matrix passes (4 tags, 3 tags, 0 tags, bad tag id)

## Success Criteria
- Public product detail JSON contains `"tags": []` field always (empty array when none)
- Public response excludes tags whose window has expired
- Admin product detail JSON contains all assigned tags regardless of window
- Replace operation is atomic (row count after = exactly the request set, no orphans)
- `DROP TABLE tags` would NOT cascade unexpectedly because junction `ON DELETE CASCADE` only deletes from junction
- No file > 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `ReplaceProductTags` not atomic → partial state after crash | Wrap DELETE + INSERT in `db.Transaction(func(tx *gorm.DB) error { ... })` |
| 3-tag cap bypass via direct DB write | Out of scope; cap is API-level only (acceptable per YAGNI) |
| Unknown tag ID silently inserted | Pre-validate via `FindTagsByIDs` count check |
| Performance: extra query per product GET | Acceptable for detail endpoint (single product); list endpoint deliberately NOT modified |
| Existing public `GetProduct` consumer breaks | Adding `tags` field is additive; existing fields unchanged → safe |

## Security Considerations
- Assignment endpoint behind admin role middleware
- Tag IDs validated against existing rows (no orphan refs)
- FK CASCADE prevents orphan junction rows on tag/product deletion

## Next Steps
- Phase 03 (admin tag CRUD UI) — independent, can run in parallel
- Phase 04 (admin product-tag assignment UI) — needs this assignment endpoint
- Phase 05 (user product detail) — needs the `tags` field on public product GET
