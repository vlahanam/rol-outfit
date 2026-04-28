# Code Review: CRUD Implementation

**Date:** 2026-04-28
**Reviewer:** code-reviewer agent
**Branch:** develop
**Scope:** Categories, Products, Cart, Orders — middleware, models, repos, services, controllers, DTOs, requests

---

## Overall Assessment

The implementation is well-structured, follows existing auth patterns closely, and compiles clean. Layer separation (repo → service → controller), functional handler factories, ozzo-validation, and i18n are all consistent with the existing codebase. No SQL injection risk (parameterized queries throughout). Two blocking security/correctness issues and several medium findings require attention before merging.

---

## Critical Issues (Blocking)

### 1. JWT `sub` claim type mismatch — `userID` is `interface{}`, not `string`, at runtime

**File:** `src/internal/middleware/jwt_middleware.go:41`
**File:** `src/internal/controllers/cart_controller.go:28-31`

`auth_service.go` stores `"sub": user.ID` where `user.ID` is a `string`. `jwt.MapClaims` unmarshals this correctly as a Go `string` at parse time. However this is **only safe** because `user.ID` is always a non-empty UUID string. The middleware stores the raw `interface{}` value from the claims map into `ctx.Locals("userID")`:

```go
ctx.Locals("userID", claims["sub"])   // type is interface{}, not string
```

`userIDFromLocals` does a type-assertion `raw.(string)` which works correctly when the claim is a string. But if any code path issues a token with a numeric `sub` (e.g., a future admin-minted token, a test token), the assertion returns `("", false)` and every request is rejected with 401. This is not a current exploit but is a latent type-unsafety bug.

**Fix:** Assert at middleware level and store as typed string:
```go
sub, ok := claims["sub"].(string)
if !ok || sub == "" {
    return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
}
ctx.Locals("userID", sub)
```

---

### 2. Public list endpoints expose HIDDEN categories/products

**File:** `src/internal/repositories/category_repo.go:62`, `product_repo.go:62`

`ListCategories` and `ListProducts` filter only on `deleted_at IS NULL`. The status constants `CATEGORY_STATUS_HIDDEN` and `PRODUCT_STATUS_HIDDEN` exist, but are never applied to queries. Any category or product set to `status=2` (hidden) by an admin is still returned to unauthenticated callers of `GET /api/v1/categories` and `GET /api/v1/products`.

**Fix:** Add `AND status = ?` filter for active status in the list queries:
```go
db := r.db.WithContext(ctx).Model(&models.Category{}).
    Where("deleted_at IS NULL AND status = ?", models.CATEGORY_STATUS_ACTIVE)
```
The `GetByID` endpoint has the same issue (allows fetching a hidden item by direct ID if you know it). Decide at the service or repo layer whether hidden-by-ID should return 404 for non-admins.

---

## High Priority

### 3. Race condition in `FindOrCreateCart`

**File:** `src/internal/repositories/cart_repo.go:29-38`

GORM's `FirstOrCreate` is not atomic — it executes a `SELECT` then a conditional `INSERT`. If two concurrent requests arrive for the same `userID` (e.g., parallel tab opens), both may run the `SELECT` and get no record, then both attempt `INSERT`, resulting in a duplicate row or a hidden error.

**Fix:** Add a unique constraint on `carts.user_id` in the DB migration, and handle the unique violation error:
```go
err := r.db.WithContext(ctx).
    Where(models.Cart{UserID: userID}).
    FirstOrCreate(&cart).Error
if err != nil {
    // retry once on unique violation
}
```
Or use `INSERT ... ON CONFLICT DO NOTHING RETURNING *` via raw SQL / GORM clause. The DB constraint is the minimum — it prevents data corruption even if GORM retries are not added.

---

### 4. `validation.Required` on `int8` Status field always passes with zero value

**File:** `src/internal/requests/order_request.go:24-32`

`validation.Required` in ozzo-validation treats `int8(0)` as empty/zero and **fails**. But `Status int8` is not sent as `0` in any intentional payload — the `Min(int8(1))` rule covers the real constraint. The `Required` rule means that if a client omits the `status` field (JSON zero-value = 0), the error message is `"validation.order_status.required"` instead of `"validation.order_status.invalid"`, which is misleading. More importantly, this means you cannot set status back to `0` by intent.

Combined with the fact that `validation.order_status.required` and `validation.order_status.invalid` keys are **missing from both `vi.json` and `ja.json`**, the i18n fallback will return the raw key string to clients.

**Fix — i18n (immediate):** Add to both locale files:
```json
"validation.order_status.required": "...",
"validation.order_status.invalid": "..."
```

**Fix — validation (consider):** Replace `Required` with just `Min(int8(1))` and `Max(int8(6))`, which already catches the zero case with the correct error key.

---

### 5. `ErrCannotCancel` returns HTTP 422 with `ErrBadRequest` body (code mismatch)

**File:** `src/internal/controllers/order_controller.go:146-148`

```go
return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
    common.ErrBadRequest.WithReason(i18n.T(lang, "error.cannot_cancel")),
)
```

HTTP status is 422 but the JSON body contains `"code": 400, "status": "Bad Request"`. This is inconsistent and will confuse clients parsing the body. The same pattern is used for `ErrNotOwned` → 403/`ErrForbidden` which is fine — only this case has a mismatch.

**Fix:** Either use `fiber.StatusUnprocessableEntity` with a matching error body, or align to HTTP 409 Conflict with `ErrConflict`:
```go
return ctx.Status(fiber.StatusConflict).JSON(
    common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_cancel")),
)
```

---

### 6. Order transaction leaks pre-transaction cart read outside the DB transaction

**File:** `src/internal/services/order_service.go:56-104`

The cart items are read **before** the transaction starts (lines 57-67), then used to build the order inside the transaction. If the cart is modified between the read and the transaction commit (another concurrent `AddCartItem` or `RemoveCartItem`), the order will be created with stale items, but the correct (newer) cart is cleared.

```go
// OUTSIDE transaction:
cartItems, err := s.cartItemRepo.ListCartItems(ctx, cart.ID)  // line 61
// ... build order from cartItems ...

// INSIDE transaction:
txRepo.CreateOrder(ctx, order)
txRepo.CreateOrderItems(ctx, orderItems)  // based on stale cartItems
txRepo.ClearCart(ctx, cart.ID)            // clears possibly-updated cart
```

**Fix:** Move the cart item read inside the transaction:
```go
err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
    txRepo := repositories.NewPostgreSQLStorage(tx)
    cartItems, err := txRepo.ListCartItems(ctx, cart.ID)
    if err != nil { return err }
    if len(cartItems) == 0 { return ErrCartEmpty }
    // ... build order and items here ...
    if err := txRepo.CreateOrder(ctx, order); err != nil { return err }
    if err := txRepo.CreateOrderItems(ctx, orderItems); err != nil { return err }
    return txRepo.ClearCart(ctx, cart.ID)
})
```

---

## Medium Priority

### 7. No format validation on `product_id` and `category_id` UUID fields

**Files:** `src/internal/requests/cart_request.go:13-15`, `product_request.go:19-21`

`product_id` and `category_id` are only checked `Required` — any non-empty string is accepted. A malformed UUID will trigger a DB error that propagates as a 500 rather than a 400. Adding a UUID format check prevents unnecessary DB round-trips.

```go
validation.Field(&r.ProductID,
    validation.Required.Error("validation.product_id.required"),
    validation.Match(regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)).
        Error("validation.product_id.invalid"),
),
```

---

### 8. `Slugify` strips all non-ASCII characters — Vietnamese/Japanese names produce empty or degenerate slugs

**File:** `src/internal/common/slug.go`

The regex `[^a-z0-9]+` strips all Unicode codepoints above ASCII. A category named `"Áo Khoác"` produces `"-o-kho-c"`. A Japanese-only name produces `""` (empty string after Trim), which passes the DB insert but `FindCategoryBySlug("")` will match the first category with an empty slug if one exists.

**Fix (minimal):** Validate that the generated slug is non-empty before proceeding in `category_service.Create` / `product_service.Create`:
```go
slug := common.Slugify(req.Name)
if slug == "" {
    return nil, ErrInvalidSlug
}
```
**Fix (full):** Use a Unicode-aware slug library (e.g., `github.com/gosimple/slug`) that transliterates accented characters.

---

### 9. `UpdateCategory`/`UpdateProduct` allow setting `status` to any `int8` value

**Files:** `src/internal/requests/category_request.go:20-34`, `product_request.go:41-57`

`UpdateCategoryRequest.Status` and `UpdateProductRequest.Status` accept any `*int8` with no range check. Status `0`, `-1`, `99`, etc. can be written to the database. Add a validation rule:
```go
if r.Status != nil {
    if err := validation.Validate(r.Status,
        validation.Min(int8(1)).Error("validation.status.invalid"),
        validation.Max(int8(2)).Error("validation.status.invalid"),
    ); err != nil { return err }
}
```

---

### 10. `phone` validation mismatch between `CreateOrderRequest` and `RegisterRequest`

`RegisterRequest.Phone` allows length 0–20 (optional), while `CreateOrderRequest.Phone` requires length 10–15. The i18n message for `validation.phone.length` says "tối đa 20 ký tự" (max 20 chars) in Vietnamese, which contradicts the 10–15 rule in the order request. Align the i18n message or use separate keys.

---

### 11. `ListAllOrders` admin endpoint does not validate the `status` query param

**File:** `src/internal/controllers/order_controller.go:165-168`

```go
statusStr := ctx.Query("status", "0")
var statusVal int
fmt.Sscanf(statusStr, "%d", &statusVal)
status := int8(statusVal)
```

`fmt.Sscanf` silently ignores parse failures and leaves `statusVal = 0`. A value like `status=999` is cast to `int8(231)` silently (overflow). Add explicit parsing and bounds check:
```go
statusVal, err := strconv.Atoi(statusStr)
if err != nil || statusVal < 0 || statusVal > 6 {
    return ctx.Status(fiber.StatusBadRequest).JSON(
        common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_order_status")),
    )
}
```

---

### 12. `UserID` is leaked in `CartDTO` and `OrderDTO` responses

**Files:** `src/internal/dto/cart_dto.go:20`, `order_dto.go:19`

```go
type CartDTO struct { UserID string `json:"user_id"` ... }
type OrderDTO struct { UserID string `json:"user_id"` ... }
```

The authenticated user already knows their own ID. Exposing it in every cart/order response is redundant and leaks internal identifier structure. For admin endpoints this may be acceptable, but for user-facing `GET /cart` and `GET /orders/:id`, it is unnecessary. Consider omitting it or using `json:"-"` for user-facing DTOs.

---

## Low Priority

### 13. Per-request service/repo construction

**Pattern across all controllers:** `repositories.NewPostgreSQLStorage(db)` and `services.NewXxxService(repo)` are constructed on every request. These are cheap struct allocations wrapping a shared `*gorm.DB`, so there is no functional issue, and it's consistent with the existing `auth_controller.go` pattern. Worth noting for when the project scales toward dependency injection.

### 14. `UpdateCategory`/`UpdateProduct` controllers use raw `err.Error()` for validation error reason

**Files:** `category_controller.go:119`, `product_controller.go:119`

`CreateCategory` uses `common.ParseValidationErrors` + i18n details; `UpdateCategory` falls back to `err.Error()` which returns raw ozzo keys like `validation.name.length` instead of translated strings. Should use the same pattern as Create.

### 15. `Cart` model has no `UpdatedAt` — inconsistent with other models

`Cart` only has `CreatedAt`. This is fine if the cart is append-only, but any future need to track last activity will require a migration. Consider adding `UpdatedAt` now for consistency.

---

## Positive Observations

- RBAC enforcement at the route level is clean and consistent. Double-assert on `userID` extraction in every protected handler is correct defense-in-depth.
- `verifyItemOwnership` in cart service is correct: it fetches item → fetches cart by userID → compares cart IDs. This prevents IDOR on cart item operations.
- Order service correctly checks `order.UserID != userID` in both `GetOrder` and `CancelOrder` independently — no single point of failure for the ownership check.
- DB transaction in `CreateFromCart` is correctly scoped to the three writes (create order, create items, clear cart). The `txRepo` pattern via `NewPostgreSQLStorage(tx)` is idiomatic.
- JWT algorithm pinning (`if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok`) prevents algorithm confusion attacks.
- `role` stored as `float64` in Locals with explicit cast in `RequireRole` is correctly documented and handles JSON numeric decoding behavior.
- `common.ParseValidationErrors` correctly maps ozzo field errors to i18n keys.
- Paging is bounded at 200 — prevents unbounded queries.
- `SoftDelete` via manual `UPDATE deleted_at` avoids GORM's inconsistent soft-delete behavior with `gorm.DeletedAt`.

---

## Summary of Blocking Items

| # | Severity | File | Issue |
|---|----------|------|-------|
| 2 | Critical | category_repo.go, product_repo.go | Hidden items visible to public |
| 1 | Critical | jwt_middleware.go | `sub` stored as `interface{}`, not asserted at middleware |
| 3 | High | cart_repo.go | Race in `FirstOrCreate` |
| 4 | High | order_request.go + i18n | Missing i18n keys + bad Required on int8 |
| 5 | High | order_controller.go | 422 status with 400 body |
| 6 | High | order_service.go | Cart read outside transaction |

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Implementation is structurally sound and matches existing patterns. Six blocking/high issues found — two security (hidden items exposed publicly, JWT sub type), one data integrity (transaction race on order creation), and three correctness/UX issues. These should be fixed before merging.
**Concerns:** Issues #2 (hidden items) and #6 (cart read outside transaction) are the highest priority — both are data integrity/security issues that won't be caught by unit tests against mocked repos.
