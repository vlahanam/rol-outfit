---
plan: 260510-2211-shop-new-arrivals-data
reviewer: code-reviewer
date: 2026-05-10
slug: shop-new-arrivals
---

# Code Review: Shop New Arrivals — Tag-Slug Filtering + Frontend Page

## Scope

| File | LOC changed |
|------|-------------|
| `backend/src/internal/repositories/product_repo.go` | +18 / -4 |
| `backend/src/internal/services/product_service.go` | +2 / -2 |
| `backend/src/internal/controllers/product_controller.go` | +2 / -1 |
| `frontend/app/[locale]/(main)/new-arrivals/page.tsx` | +55 / -68 |
| `frontend/messages/vn.json` | +1 |
| `frontend/messages/jp.json` | +1 |

## Overall Assessment

The implementation is largely correct. The SQL is safe against injection (parameterized), the time-window check mirrors the existing `GetActiveTags` service logic, and the frontend data flow replaces static data cleanly. Three issues need attention before merge: a **duplicate-row bug** that corrupts pagination totals, a **null-safety crash** on `sale_price` in the frontend comparison, and a **silent fetch error** that leaves users staring at a broken loading state.

---

## Critical Issues

### 1. [BLOCKING] Duplicate rows when a product carries multiple tags with the same slug

**File:** `product_repo.go` lines 71-74

The JOIN on `product_tags` + `tags` produces one row **per matching tag row**, not per product. A product tagged with the same slug twice (valid if the same tag appears as two separate rows in `product_tags`, or if two different tags happen to share the same slug after a data migration) yields duplicate rows in both the COUNT query and the Find query.

Symptoms:
- `total` is inflated: a product with 2 matching rows is counted twice, so `paging.total` is wrong.
- The `Find` result contains duplicate `Product` objects, shown twice in the UI.
- The `Offset`/`Limit` arithmetic is based on the inflated count, so the last page may show fewer items than expected or repeat items across pages.

**Fix — add `.Distinct("products.id")` to the db chain before the Count and Find calls:**

```go
if tagSlug != "" {
    now := time.Now()
    db = db.
        Joins("JOIN product_tags ON product_tags.product_id = products.id").
        Joins("JOIN tags ON tags.id = product_tags.tag_id").
        Where("tags.slug = ?", tagSlug).
        Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
        Distinct("products.id") // prevent duplicates from multi-tag products
}
```

Note: GORM's `.Count()` after `.Distinct()` generates `COUNT(DISTINCT products.id)` automatically. The `.Find()` will use `SELECT DISTINCT products.id, products.*` which is valid in PostgreSQL. Alternatively, replace the JOIN with a subquery via `.Where("products.id IN (?)", subquery)`, which is easier to reason about but requires a raw sub-select.

---

### 2. [BLOCKING] `sale_price` null-safety crash in the frontend

**File:** `frontend/app/[locale]/(main)/new-arrivals/page.tsx` lines 98-109

```tsx
originalPrice={
  product.sale_price < product.default_price   // line 98
    ? formatPrice(product.default_price)
    : undefined
}
discountPercent={
  product.discount_percent > 0 &&
  product.sale_price < product.default_price   // line 104
    ? Math.round(...)
    : undefined
}
```

The TypeScript type declares `sale_price: number` (non-optional, line 71 of `types/api.ts`). However the backend's `EffectivePrice` returns the raw `DefaultPrice` when no discount is active, so `sale_price` will equal `default_price` for undiscounted products — that is fine. The runtime risk is different: the backend DTO sets `SalePrice` via `EffectivePrice(...)` which always returns a `float64`, so in normal operation the field will never be null.

**However**, the `effectivePrice` helper at line 16 uses `?? p.default_price`:

```tsx
function effectivePrice(p: Product): number {
  return p.sale_price ?? p.default_price;
}
```

The `??` operator guards against `null`/`undefined`. If `sale_price` is `0` (a product priced at zero), `?? p.default_price` does NOT fire (0 is not nullish), so `effectivePrice` correctly returns 0. That part is safe.

The crash path is the **inline comparisons at lines 98 and 104**: `product.sale_price < product.default_price`. If `sale_price` ever arrives as `null` or `undefined` from the API (network issue, backend field omission), `null < 5000` evaluates to `true` in JavaScript, and `formatPrice(null)` would then call `null.toLocaleString(...)` — TypeError crash, white screen.

**Fix — guard the comparisons:**

```tsx
originalPrice={
  product.sale_price != null && product.sale_price < product.default_price
    ? formatPrice(product.default_price)
    : undefined
}
discountPercent={
  product.discount_percent > 0 &&
  product.sale_price != null &&
  product.sale_price < product.default_price
    ? Math.round((1 - product.sale_price / product.default_price) * 100)
    : undefined
}
```

Alternatively, delegate to `effectivePrice(product)` (already null-safe) and compare that against `default_price`.

---

## High Priority

### 3. [HIGH] Silent fetch error — users see permanent loading or empty state

**File:** `frontend/app/[locale]/(main)/new-arrivals/page.tsx` lines 29-33

```tsx
api
  .get<ApiResponse<Product[]>>("/products?tag=new&limit=50")
  .then((res) => setProducts(res.data ?? []))
  .catch(() => {})           // swallowed entirely
  .finally(() => setLoading(false));
```

The `.catch(() => {})` swallows all errors silently. On network failure or a 5xx response, `loading` becomes `false`, `products` stays `[]`, and the page renders the `noProducts` empty-state — the user sees "No new products" even though the shop has 50. There is no way to distinguish "zero products tagged new" from "API is down".

**Fix — add an error state:**

```tsx
const [error, setError] = useState(false);

useEffect(() => {
  api
    .get<ApiResponse<Product[]>>("/products?tag=new&limit=50")
    .then((res) => setProducts(res.data ?? []))
    .catch(() => setError(true))
    .finally(() => setLoading(false));
}, []);

// In JSX:
if (error) return <div className="text-center py-12 text-red-500">{tCommon("error")}</div>;
```

---

### 4. [HIGH] COUNT is inflated by JOIN before the fix for issue #1 is applied

Already described under issue #1 — the inflated total breaks pagination math. Calling it out separately because it also affects the "Showing X new products" counter displayed on the page (the frontend uses `sorted.length` which reflects deduplicated client-side data, but the `paging.total` sent to any caller is wrong).

---

## Medium Priority

### 5. [MEDIUM] `?tag=` accepts unbounded arbitrary string input — no sanitization or length cap

**File:** `product_controller.go` line 27

```go
tagSlug := ctx.Query("tag")
```

Any string up to the HTTP header limit is passed straight through to the SQL WHERE clause. GORM does parameterize it (safe from injection), but:
- A 10,000-character slug wastes DB query time and memory allocating the query string.
- Callers probing the API can observe timing differences between "slug not found" and "slug found with 0 products".

**Fix — trim and length-cap the input:**

```go
tagSlug := strings.TrimSpace(ctx.Query("tag"))
if len(tagSlug) > 100 {
    tagSlug = ""
}
```

### 6. [MEDIUM] `Count` + `Find` execute on the same GORM chain — ordering interaction

**File:** `product_repo.go` line 79-82

```go
if err := db.Count(&total).Error; err != nil { ... }
if err := db.Offset(offset).Limit(limit).Order("products.created_at DESC").Find(&products).Error; err != nil { ... }
```

GORM's `Count` modifies the session chain in-place (removes `LIMIT`/`OFFSET`/`ORDER BY` for the count query) but the object `db` is shared between the two calls. This pattern works today because GORM creates a new statement for each terminal call (`Count`, `Find`), but it is fragile and depends on GORM's internal session behavior. The safer pattern is to clone the query before branching:

```go
countDB := db.Session(&gorm.Session{})
if err := countDB.Count(&total).Error; err != nil { ... }
if err := db.Offset(offset).Limit(limit).Order("products.created_at DESC").Find(&products).Error; err != nil { ... }
```

This is the same pattern used in many places in the existing codebase implicitly — worth making explicit here because the JOIN makes the statement more complex than the baseline `ListProducts`.

### 7. [MEDIUM] `limit=50` hardcoded in the frontend — bypasses Paging.Process() cap

**File:** `frontend/app/[locale]/(main)/new-arrivals/page.tsx` line 30

```tsx
api.get<ApiResponse<Product[]>>("/products?tag=new&limit=50")
```

The backend `Paging.Process()` caps limit at 200, so 50 is well under the ceiling. But 50 is hardcoded with no `page` parameter, meaning the request always fetches page 1. If the "new" tag grows beyond 50 products, excess items are silently dropped with no pagination UI or indication that the list is truncated. This is a UX issue now and a correctness issue later.

A reasonable short-term fix: add a comment explaining the 50-item ceiling is intentional for a homepage teaser, and add a "Show all" link if `paging.total > products.length`. Longer term: add cursor pagination to the page.

---

## Low Priority

### 8. [LOW] Stale i18n keys for product names remain in both message files

The old static product name keys (`cottonLogo`, `officeSuit`, `casualShirt`, etc.) remain in `vn.json` and `jp.json` under `NewArrivalsPage`. They are no longer referenced by any code. They are harmless but add noise and will confuse future translators.

**Fix:** Remove the unused keys from both files after confirming no other page references them (`grep -r "cottonLogo\|officeSuit" frontend/`).

### 9. [LOW] `onClick` on a `div` instead of a link — keyboard navigation broken

**File:** `frontend/app/[locale]/(main)/new-arrivals/page.tsx` lines 89-93

```tsx
<div
  key={product.id}
  onClick={() => router.push(`/product/${product.id}`)}
  className="cursor-pointer"
>
```

Keyboard users and screen readers cannot activate this element. The pre-existing code had the same pattern, so this is not a regression, but it is worth fixing given the surrounding changes.

**Fix:** Wrap with `<Link href={`/product/${product.id}`}>` which renders an `<a>` tag natively navigable, instead of the `onClick` div pattern.

---

## Positive Observations

- All SQL parameters are properly parameterized (no string interpolation) — injection-safe.
- `products.` table prefix was consistently added to all column references in the base `WHERE` clause and `ORDER BY`, preventing ambiguous column errors after the JOIN.
- The time-window check (`start_at IS NULL OR start_at <= now`) exactly mirrors the existing `FindActiveTagsByProductID` logic — consistent behavior across the two code paths.
- The `effectivePrice` helper correctly uses `??` (nullish coalescing) rather than `||` (falsy), so a product priced at 0 is handled correctly.
- The `no-tag` path (empty `tagSlug`) is unchanged from before — no JOIN, no extra WHERE clauses. Existing callers are unaffected.
- `key={product.id}` replaces `key={idx}` — correct.
- Navigation now uses `product.id` instead of the hardcoded `/product/1`.

---

## Recommended Actions (Priority Order)

1. **[BLOCKING]** Add `.Distinct("products.id")` to the JOIN path in `ListProducts` — fixes duplicate rows and inflated COUNT.
2. **[BLOCKING]** Guard `sale_price` comparisons with `product.sale_price != null` in the TSX — prevents runtime TypeError.
3. **[HIGH]** Add error state to the `useEffect` fetch — prevents silent empty-state confusion on API failure.
4. **[MEDIUM]** Length-cap `?tag=` query param at 100 chars.
5. **[MEDIUM]** Consider `db.Session(&gorm.Session{})` clone before the Count/Find split.
6. **[LOW]** Remove unused i18n keys from message files.
7. **[LOW]** Replace `onClick div` with `Link` for accessibility.

---

## Unresolved Questions

- Is `tags.slug` guaranteed unique in the DB schema? If not, two different tags with slug `"new"` could both match, worsening the duplicate-row problem. A `UNIQUE` index on `tags.slug` should be confirmed or added.
- Is a product allowed to be tagged with the same tag more than once in `product_tags`? If `(product_id, tag_id)` is the composite PK (it is, per the model), duplicates within the same tag are impossible. But two tags with the same slug (if not unique-constrained) can still cause duplicates. Confirm constraint.
- Should `sale_price = 0` be a valid backend value (truly free product)? The current frontend `effectivePrice` handles it correctly, but the `originalPrice` condition `sale_price < default_price` would show a strikethrough for a free item — correct behavior or misleading?
