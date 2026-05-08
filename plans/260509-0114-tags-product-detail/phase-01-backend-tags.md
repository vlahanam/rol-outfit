# Phase 01 — Backend: Tags CRUD

## Context Links
- Existing pattern reference: `backend/src/internal/{models,repositories,services,controllers,dto,requests}/category*.go`
- Migration reference: `backend/database/migrations/000002_create_categories.{up,down}.sql`
- Slug helper: `backend/src/internal/common/slug.go` → `common.Slugify`
- Route registration: `backend/src/internal/initialize/route.go`

## Overview
- **Priority:** P2 (foundation for Phase 02 + Phase 03)
- **Status:** pending
- **Effort:** 3h
- **Description:** Create `tags` table + Go layer (model, repo, service, controller, DTO, request, routes) following the category CRUD blueprint exactly. Tags differ from categories by carrying nullable `start_at` and `end_at` activation window.

## Key Insights
- No soft delete on tags (per user spec — no `deleted_at` column). Use hard `DELETE`. This simplifies the junction CASCADE in Phase 02.
- Slug auto-derived from name via `common.Slugify` (matches category pattern).
- "Active" semantics live in the SERVICE layer for reuse: a helper `IsActive(t *Tag, now time.Time) bool`. Public list/get filters by active window; admin endpoints don't.
- No status int8 column — activation is purely time-window driven (KISS).

## Requirements

### Functional
- POST `/api/v1/tags` (admin) → create tag
- GET `/api/v1/tags` (public) → list ACTIVE tags only, paginated
- GET `/api/v1/tags/:id` (public) → fetch tag (active only)
- PUT `/api/v1/tags/:id` (admin) → update name/window
- DELETE `/api/v1/tags/:id` (admin) → hard delete
- GET `/api/v1/admin/tags` (admin) → list ALL tags including inactive, paginated
- GET `/api/v1/admin/tags/:id` (admin) → fetch any tag

### Non-Functional
- Each Go file ≤ 200 lines
- Slug uniqueness enforced via DB index + service-level pre-check (mirrors categories)
- All errors returned with i18n keys; locales updated for `tag_not_found`, `tag_slug_taken`

## Architecture

### Migration `000011_create_tags`

```sql
-- up
CREATE TABLE IF NOT EXISTS tags (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT         NOT NULL,
    slug       TEXT         NOT NULL,
    start_at   TIMESTAMPTZ,
    end_at     TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tags_slug      ON tags (slug);
CREATE INDEX        idx_tags_window    ON tags (start_at, end_at);

COMMENT ON COLUMN tags.start_at IS 'Bắt đầu hiển thị (NULL = không giới hạn)';
COMMENT ON COLUMN tags.end_at   IS 'Kết thúc hiển thị (NULL = không giới hạn)';

-- down
DROP TABLE IF EXISTS tags;
```

### Model `models/tag.go`

```go
type Tag struct {
    ID        string     `gorm:"type:uuid;primaryKey"`
    Name      string     `gorm:"column:name"`
    Slug      string     `gorm:"column:slug"`
    StartAt   *time.Time `gorm:"column:start_at"`
    EndAt     *time.Time `gorm:"column:end_at"`
    CreatedAt time.Time  `gorm:"column:created_at"`
    UpdatedAt time.Time  `gorm:"column:updated_at"`
}

func (Tag) TableName() string { return "tags" }
```

### Repository `repositories/tag_repo.go`

Interface methods (mirror categories, no soft-delete variant):
- `CreateTag`, `FindTagByID`, `FindTagBySlug`
- `ListTags(offset, limit)` — admin list (all)
- `ListActiveTags(now, offset, limit)` — public list filtered by window
- `FindActiveTagByID(id, now)` — public get
- `UpdateTag(id, fields)` — partial update
- `DeleteTag(id)` — hard delete

Active filter SQL:
```
(start_at IS NULL OR start_at <= ?) AND (end_at IS NULL OR end_at >= ?)
```

### Service `services/tag_service.go`

Errors: `ErrTagNotFound`, `ErrTagSlugTaken`, `ErrTagInvalidWindow` (when `end_at < start_at`).

Methods: `Create`, `Update`, `Delete`, `GetByID`, `GetByIDAdmin`, `List` (active), `ListAdmin` (all).

Service `Create` flow:
1. `Slugify(req.Name)` → check `FindTagBySlug` → 409 if taken
2. Validate window: if both non-nil, ensure `end_at >= start_at`
3. Insert with `uuid.New().String()`

### DTO `dto/tag_dto.go`

```go
type TagDTO struct {
    ID        string  `json:"id"`
    Name      string  `json:"name"`
    Slug      string  `json:"slug"`
    StartAt   *string `json:"start_at"` // RFC3339 or null
    EndAt     *string `json:"end_at"`
    CreatedAt string  `json:"created_at"`
    UpdatedAt string  `json:"updated_at"`
}
```

### Request `requests/tag_request.go`

```go
type CreateTagRequest struct {
    Name    string     `json:"name"`
    StartAt *time.Time `json:"start_at"`
    EndAt   *time.Time `json:"end_at"`
}
type UpdateTagRequest struct {
    Name    *string    `json:"name"`
    StartAt *time.Time `json:"start_at"`
    EndAt   *time.Time `json:"end_at"`
}
```
Validate via ozzo-validation: `Name` required, length 2–100.

### Controller `controllers/tag_controller.go`

Handlers: `ListTags`, `GetTag`, `CreateTag`, `UpdateTag`, `DeleteTag`, `AdminListTags`, `AdminGetTag`. Pattern matches `category_controller.go` 1:1.

### Routes (route.go addition)

```go
// Tags
tags := v1.Group("/tags")
tags.Get("/", controllers.ListTags(db))
tags.Get("/:id", controllers.GetTag(db))
adminTags := tags.Use(middleware.JWTAuth(jwtSecret), middleware.RequireRole(float64(models.USER_ROLE_ADMIN)))
adminTags.Post("/", controllers.CreateTag(db))
adminTags.Put("/:id", controllers.UpdateTag(db))
adminTags.Delete("/:id", controllers.DeleteTag(db))

// Admin tags (full list incl. inactive)
adminTagsGroup := v1.Group("/admin/tags",
    middleware.JWTAuth(jwtSecret),
    middleware.RequireRole(float64(models.USER_ROLE_ADMIN)),
)
adminTagsGroup.Get("/", controllers.AdminListTags(db))
adminTagsGroup.Get("/:id", controllers.AdminGetTag(db))
```

### i18n locale additions (`vi.json`, `ja.json`)

```
"error.tag_not_found": "Không tìm thấy thẻ tag" / "タグが見つかりません"
"error.tag_slug_taken": "Slug thẻ tag đã tồn tại" / "タグのスラッグは既に存在します"
"error.tag_invalid_window": "Khoảng thời gian hiển thị không hợp lệ" / "表示期間が無効です"
```

## Related Code Files

### Create
- `backend/database/migrations/000011_create_tags.up.sql`
- `backend/database/migrations/000011_create_tags.down.sql`
- `backend/src/internal/models/tag.go`
- `backend/src/internal/repositories/tag_repo.go`
- `backend/src/internal/services/tag_service.go`
- `backend/src/internal/controllers/tag_controller.go`
- `backend/src/internal/dto/tag_dto.go`
- `backend/src/internal/requests/tag_request.go`

### Modify
- `backend/src/internal/initialize/route.go` (add tags route blocks only)
- `backend/src/internal/i18n/locales/vi.json`
- `backend/src/internal/i18n/locales/ja.json`

## Implementation Steps

1. Write migration pair `000011_create_tags.{up,down}.sql`
2. Create `models/tag.go`
3. Create `repositories/tag_repo.go` with all methods (active-filtered + unfiltered variants)
4. Create `dto/tag_dto.go` with `ToTagDTO`
5. Create `requests/tag_request.go` with ozzo Validate
6. Create `services/tag_service.go` with errors + methods
7. Create `controllers/tag_controller.go` (7 handlers, 1 file ≤ 200 lines — split into `tag_controller_admin.go` if needed)
8. Add i18n keys to `vi.json` and `ja.json`
9. Register routes in `route.go`
10. Run `make rebuild` → confirm migration applied via `psql \dt tags`
11. Smoke test endpoints with curl + admin JWT

## Todo List

- [ ] Migration up/down SQL written and verified locally
- [ ] `models/tag.go` created
- [ ] `repositories/tag_repo.go` created with active-window filter
- [ ] `dto/tag_dto.go` with nullable RFC3339 timestamps
- [ ] `requests/tag_request.go` with validation
- [ ] `services/tag_service.go` with slug + window validation
- [ ] `controllers/tag_controller.go` (split if > 200 lines)
- [ ] i18n keys added to vi.json and ja.json
- [ ] Routes registered in `route.go`
- [ ] `go build ./src/cmd/main.go` passes
- [ ] `make rebuild` applies migration cleanly
- [ ] Smoke test: create → list (admin) → list (public, before window) → list (public, in window) → update → delete

## Success Criteria
- All endpoints return correct status codes (201, 200, 204, 404, 409)
- Public endpoints exclude tags whose window has not started or has ended
- Admin endpoints include those tags
- Slug collisions return 409 with i18n reason
- Compile passes; no file > 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `*time.Time` JSON parsing fails on empty string from frontend | Frontend sends `null` (not `""`) for unset; validate at request layer |
| Window validation gap (start > end) | Service-level check with `ErrTagInvalidWindow` |
| Slug collision under race | Unique index is the source of truth; pre-check is best-effort UX |

## Security Considerations
- All write endpoints behind `JWTAuth + RequireRole(ADMIN)`
- Slug derived server-side (user cannot inject arbitrary slug)
- No SQL injection surface (GORM parameterized queries)

## Next Steps
- Phase 02 (junction table + assignment endpoints) depends on the tags table existing
- Phase 03 (admin UI) depends on these endpoints being deployed
