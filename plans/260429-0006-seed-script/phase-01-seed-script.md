# Phase 01 — Seed Script Implementation

## Context Links

- Models: `backend/src/internal/models/{user,category,product}.go`
- DB init: `backend/src/internal/initialize/{loadconfig,postgres}.go`
- Slug util: `backend/src/internal/common/slug.go`
- Existing entry pattern: `backend/src/cmd/main.go`
- Plan overview: `./plan.md`

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Standalone `go run` command that seeds Users, Categories, Products idempotently. Adds `make seed` Makefile target.

## Key Insights

- Reuse `initialize.LoadConfig()` + `initialize.InitDB(cfg)` — config is already env-driven and works inside the docker `backend` container (env vars supplied by compose).
- Idempotency uses GORM's `FirstOrCreate` semantics implemented manually via `Where().First()` + check `errors.Is(err, gorm.ErrRecordNotFound)` — clearer logging than `FirstOrCreate` and lets us emit "skip (exists)" lines.
- UUID generated app-side (`uuid.NewString()`) — matches existing model pattern (`type:uuid;primaryKey`, no DB default).
- Products need `CategoryID` resolved by slug lookup AFTER categories are seeded — enforces seed order in `RunAll`.
- `Data` field is `json.RawMessage` — pass raw `[]byte(...)` literal, no marshal needed.

## Requirements

**Functional:**
- Seed 1 admin + 2 customers (passwords bcrypt-hashed)
- Seed 4 categories with stable slugs
- Seed 12 products (3 per category) with stable slugs
- Skip insert when row with same email/slug exists; log skip
- Print final summary: created vs skipped per entity

**Non-functional:**
- Each file < 200 lines
- Single transaction NOT required — independent inserts, skip-on-exist makes partial failure recoverable
- Compile cleanly under Go 1.26.2

## Architecture

```
cmd/seed/main.go
   |
   v
internal/seeder/seeder.go      RunAll(db) -> orchestrates 3 seeders, logs summary
   |        |        |
   v        v        v
seed_users.go  seed_categories.go  seed_products.go
                                       |
                                       +-- looks up category by slug to get CategoryID
```

**Data flow:**
1. `main.go` loads config, opens DB, calls `seeder.RunAll(db)`.
2. `RunAll` runs `SeedUsers` -> `SeedCategories` -> `SeedProducts` in order.
3. Each seeder iterates a hard-coded slice; for each item: query existing -> if found, log skip -> else insert + log create.

## Related Code Files

**Create:**
- `backend/src/cmd/seed/main.go`
- `backend/src/internal/seeder/seeder.go`
- `backend/src/internal/seeder/seed_users.go`
- `backend/src/internal/seeder/seed_categories.go`
- `backend/src/internal/seeder/seed_products.go`

**Modify:**
- `Makefile` (repo root) — add `seed` target + update `.PHONY`

**Read for context (no edits):**
- `backend/src/internal/models/user.go`
- `backend/src/internal/models/category.go`
- `backend/src/internal/models/product.go`
- `backend/src/internal/common/slug.go`
- `backend/src/internal/initialize/loadconfig.go`
- `backend/src/internal/initialize/postgres.go`

## Implementation Steps

### Step 1 — Create entry point

**File:** `backend/src/cmd/seed/main.go`

```go
package main

import (
	"log"

	"github.com/vlahanam/rol-outfit/src/internal/initialize"
	"github.com/vlahanam/rol-outfit/src/internal/seeder"
)

func main() {
	cfg := initialize.LoadConfig()
	db := initialize.InitDB(cfg)

	if err := seeder.RunAll(db); err != nil {
		log.Fatalf("seed thất bại: %v", err)
	}
	log.Println("seed hoàn tất")
}
```

### Step 2 — Create orchestrator

**File:** `backend/src/internal/seeder/seeder.go`

```go
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

	log.Println("=== seed kết thúc ===")
	return nil
}
```

### Step 3 — Seed users

**File:** `backend/src/internal/seeder/seed_users.go`

```go
package seeder

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type seedUser struct {
	FullName string
	Email    string
	Password string
	Phone    string
	Address  string
	Role     int8
}

var seedUsers = []seedUser{
	{
		FullName: "Quản Trị Viên",
		Email:    "admin@rol-outfit.com",
		Password: "Admin@123",
		Phone:    "0900000001",
		Address:  "Trụ sở Rol Outfit, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_ADMIN,
	},
	{
		FullName: "Nguyễn Văn A",
		Email:    "customer1@rol-outfit.com",
		Password: "Customer@123",
		Phone:    "0900000002",
		Address:  "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_CUSTOMER,
	},
	{
		FullName: "Trần Thị B",
		Email:    "customer2@rol-outfit.com",
		Password: "Customer@123",
		Phone:    "0900000003",
		Address:  "456 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_CUSTOMER,
	},
}

// SeedUsers inserts default users; skips by matching email.
func SeedUsers(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, u := range seedUsers {
		var existing models.User
		err := db.Where("email = ?", u.Email).First(&existing).Error
		if err == nil {
			log.Printf("  skip user (exists): %s", u.Email)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return res, err
		}

		row := models.User{
			ID:       uuid.NewString(),
			FullName: u.FullName,
			Email:    u.Email,
			Password: string(hash),
			Address:  u.Address,
			Phone:    u.Phone,
			Role:     u.Role,
			Status:   1,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created user: %s", u.Email)
		res.Created++
	}
	return res, nil
}
```

### Step 4 — Seed categories

**File:** `backend/src/internal/seeder/seed_categories.go`

```go
package seeder

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type seedCategory struct {
	Name        string
	Description string
}

var seedCategories = []seedCategory{
	{Name: "Áo Nam", Description: "Bộ sưu tập áo dành cho nam giới"},
	{Name: "Quần Nam", Description: "Quần dài, quần short cho nam"},
	{Name: "Áo Nữ", Description: "Bộ sưu tập áo dành cho nữ giới"},
	{Name: "Quần Nữ", Description: "Quần dài, quần short cho nữ"},
}

// SeedCategories inserts default categories; skips by matching slug.
func SeedCategories(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, c := range seedCategories {
		slug := common.Slugify(c.Name)

		var existing models.Category
		err := db.Where("slug = ?", slug).First(&existing).Error
		if err == nil {
			log.Printf("  skip category (exists): %s", slug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		row := models.Category{
			ID:          uuid.NewString(),
			Name:        c.Name,
			Slug:        slug,
			Status:      models.CATEGORY_STATUS_ACTIVE,
			Description: c.Description,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created category: %s", slug)
		res.Created++
	}
	return res, nil
}
```

### Step 5 — Seed products

**File:** `backend/src/internal/seeder/seed_products.go`

```go
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
}

// 3 products per category = 12 total. Prices in VND, range 150k–850k.
var seedProducts = []seedProduct{
	// Áo Nam
	{CategorySlug: "ao-nam", Name: "Áo Sơ Mi Trắng Nam Basic", Price: 350000, Description: "Áo sơ mi cotton trắng, form regular fit"},
	{CategorySlug: "ao-nam", Name: "Áo Thun Nam Cổ Tròn", Price: 180000, Description: "Áo thun cotton 100%, thoáng mát"},
	{CategorySlug: "ao-nam", Name: "Áo Polo Nam Kẻ Sọc", Price: 420000, Description: "Áo polo phối kẻ, lịch sự năng động"},
	// Quần Nam
	{CategorySlug: "quan-nam", Name: "Quần Jean Nam Slim Fit", Price: 650000, Description: "Quần jean slim, chất denim co giãn"},
	{CategorySlug: "quan-nam", Name: "Quần Tây Nam Công Sở", Price: 550000, Description: "Quần tây vải tuytsi, dáng straight"},
	{CategorySlug: "quan-nam", Name: "Quần Short Kaki Nam", Price: 280000, Description: "Quần short kaki mùa hè"},
	// Áo Nữ
	{CategorySlug: "ao-nu", Name: "Áo Sơ Mi Nữ Tay Phồng", Price: 380000, Description: "Áo sơ mi tay bồng phong cách Hàn"},
	{CategorySlug: "ao-nu", Name: "Áo Thun Nữ Crop Top", Price: 199000, Description: "Áo crop top trẻ trung"},
	{CategorySlug: "ao-nu", Name: "Áo Kiểu Nữ Voan Hoa", Price: 450000, Description: "Áo voan họa tiết hoa nhí"},
	// Quần Nữ
	{CategorySlug: "quan-nu", Name: "Quần Jean Nữ Ống Rộng", Price: 620000, Description: "Quần jean ống suông cá tính"},
	{CategorySlug: "quan-nu", Name: "Quần Tây Nữ Lưng Cao", Price: 520000, Description: "Quần tây cạp cao thanh lịch"},
	{CategorySlug: "quan-nu", Name: "Chân Váy Chữ A Nữ", Price: 320000, Description: "Chân váy chữ A vải tweed"},
}

var defaultProductData = json.RawMessage(`{"material":"cotton","sizes":["S","M","L","XL"]}`)

// SeedProducts inserts default products; skips by matching slug.
// Resolves CategoryID by looking up category slug.
func SeedProducts(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, p := range seedProducts {
		var cat models.Category
		if err := db.Where("slug = ?", p.CategorySlug).First(&cat).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("  skip product (category missing): %s -> %s", p.Name, p.CategorySlug)
				res.Skipped++
				continue
			}
			return res, err
		}

		slug := common.Slugify(p.Name)
		var existing models.Product
		err := db.Where("slug = ?", slug).First(&existing).Error
		if err == nil {
			log.Printf("  skip product (exists): %s", slug)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		row := models.Product{
			ID:           uuid.NewString(),
			CategoryID:   cat.ID,
			Name:         p.Name,
			Slug:         slug,
			DefaultPrice: p.Price,
			Description:  p.Description,
			Status:       models.PRODUCT_STATUS_ACTIVE,
			Data:         defaultProductData,
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
```

### Step 6 — Update Makefile

Add the `seed` target after `frontend-shell` (or anywhere in the targets block) and append `seed` to `.PHONY`.

**Patch (apply to repo-root `Makefile`):**

```makefile
seed:
	$(COMPOSE) exec backend go run ./src/cmd/seed/main.go
```

And update the `.PHONY` line to include `seed`:

```makefile
.PHONY: up down logs build rebuild ps db-shell backend-shell frontend-shell seed
```

### Step 7 — Build verification

From repo root:

```bash
cd backend && go build ./src/...
```

Must exit 0 with no output. If `go.mod` complains about missing deps, run `go mod tidy` (deps `bcrypt`, `uuid`, `gorm` are already present per task brief).

### Step 8 — Runtime verification

```bash
make up                  # ensure backend container + DB are up & migrated
make seed                # first run — should log "created" for all 19 rows
make seed                # second run — should log "skip (exists)" for all 19 rows
```

Spot check via DB:

```bash
make db-shell
```
```sql
SELECT COUNT(*) FROM users;       -- expect 3
SELECT COUNT(*) FROM categories;  -- expect 4
SELECT COUNT(*) FROM products;    -- expect 12
```

## Todo List

- [x] Create `backend/src/cmd/seed/main.go`
- [x] Create `backend/src/internal/seeder/seeder.go`
- [x] Create `backend/src/internal/seeder/seed_users.go`
- [x] Create `backend/src/internal/seeder/seed_categories.go`
- [x] Create `backend/src/internal/seeder/seed_products.go`
- [x] Add `seed` target to Makefile and update `.PHONY`
- [x] Run `cd backend && go build ./src/...` — passes
- [x] Run `make up` to ensure DB is migrated
- [x] Run `make seed` (first time) — verify 3+4+12 rows created
- [x] Run `make seed` (second time) — verify all rows skipped
- [x] Verify counts via `make db-shell`

## Success Criteria

- `cd backend && go build ./src/...` exits 0
- `make seed` on empty DB inserts exactly: 3 users, 4 categories, 12 products
- `make seed` on populated DB inserts 0 rows, exits 0, logs "skip (exists)" for each
- `SELECT COUNT(*)` matches expected counts after any number of `make seed` runs
- Bcrypt-hashed passwords verifiable: login with `admin@rol-outfit.com / Admin@123` succeeds via existing auth endpoint
- All seeder files < 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `slug` column lacks unique index → race could insert duplicates | Single-process dev tool; document. Future: add unique index migration if needed |
| FK constraint between products.category_id and categories.id missing in schema | Code resolves category by slug FIRST and skips if missing — fails gracefully regardless of DB-level FK |
| Bcrypt password mismatch with auth login flow | Use `bcrypt.GenerateFromPassword` with `DefaultCost` — same library auth handler uses |
| Vietnamese chars mangled in DB | DB uses UTF-8 (default for Postgres); `Slugify` strips non-ASCII → slugs are pure ASCII |
| Running seed before migrations applied → table missing | `make up` triggers backend boot which runs migrations; `make seed` should be run after `make up` (documented in Step 8) |

## Security Considerations

- Default passwords (`Admin@123`, `Customer@123`) are DEV-ONLY. Never run this seeder against production.
- Add a guard if needed in future: check `os.Getenv("APP_ENV") != "production"` before running. (Not adding now — YAGNI; current `LoadConfig` has no `AppEnv` field.)
- Passwords hashed with bcrypt before insert — no plaintext in DB.
- Seeder file does NOT log plaintext passwords.

## Improvements Implemented

- **Unicode Normalization in Slugify** (bonus): Fixed critical bug in `backend/src/internal/common/slug.go` — added NFC normalization via `golang.org/x/text/unicode/norm` to handle Vietnamese diacritics correctly. Vietnamese names like "Áo Nam" now reliably generate `ao-nam` instead of mangled slugs. This fix applies to all category and product slugs.

## Next Steps

- (Optional, future) Add `APP_ENV` config field + production guard in seeder
- (Optional, future) Seed Carts/Orders once those flows have stable repos
- Update `docs/development-roadmap.md` and `docs/project-changelog.md` after merge (delegate to `docs-manager`)

## Unresolved Questions

- None. All inputs (models, constants, init pattern, slug util, locale tone) supplied in task brief.
