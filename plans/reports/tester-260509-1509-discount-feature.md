# Product Discount Feature Test Report
**Date:** 2026-05-09 15:09  
**Scope:** Backend discount logic + Frontend integration

---

## Test Results Overview

| Metric | Result |
|--------|--------|
| **Backend Compilation** | ✅ PASS |
| **Go Tests Executed** | 0/13 packages (NO TESTS FOUND) |
| **TypeScript Compilation** | ✅ PASS |
| **Frontend Tests** | Not configured |
| **Overall Status** | ⚠️ CRITICAL: Zero test coverage |

---

## Compilation Verification

### Backend (`go build ./...`)
- ✅ **All packages compile cleanly**
- No syntax errors
- All dependencies resolved

**Packages verified:**
- `src/cmd` — entrypoint
- `src/internal/controllers`
- `src/internal/dto` (discount helper, variant DTO)
- `src/internal/models` (product, variant schemas)
- `src/internal/services` (cart service)
- `src/internal/repositories`
- All other internal packages

### Frontend (`npx tsc --noEmit`)
- ✅ **TypeScript compilation successful**
- No type errors
- All imports resolved

---

## Code Logic Review

### 1. `discount_helper.go` — IsDiscountActive() Logic

**Function Signature:**
```go
func IsDiscountActive(percent float64, start, end *time.Time) bool
```

**Edge Cases Verified:**

| Case | Input | Output | Status |
|------|-------|--------|--------|
| Zero percent | `percent=0` | `false` | ✅ Correct (line 8) |
| Negative percent | `percent=-5` | `false` | ✅ Correct (<=0 check) |
| Nil start, nil end | `start=nil, end=nil` | Depends on percent | ✅ Correct (no constraints) |
| Future start time | `start=tomorrow` | `false` | ✅ Correct (Before check, line 12-13) |
| Expired end time | `end=yesterday` | `false` | ✅ Correct (After check, line 15-16) |
| Active window | `start=yesterday, end=tomorrow` | `true` (if percent>0) | ✅ Correct |
| Boundary: exactly at start | `now == start` | `true` | ✅ Correct (Before is strict) |
| Boundary: exactly at end | `now == end` | `false` | ⚠️ **ISSUE**: After() returns true on equality |
| Nil start only | `start=nil, end=tomorrow` | Depends on percent | ✅ Correct |
| Nil end only | `start=yesterday, end=nil` | Depends on percent | ✅ Correct |

**CONCERN:** Boundary case at `end` time. `time.After(*end)` is `true` when `now >= *end`, causing discount to expire AT the end time (not after). This is reasonable but untested.

**EffectivePrice() Logic:**
```go
return price * (1 - percent/100)
```
- ✅ Correct calculation (linear discount)
- Division by 100 handles percentage properly
- No integer overflow risk (float64)

---

### 2. `product_variant_dto.go` — ToVariantDTOWithProduct() Fallback Hierarchy

**Fallback Logic (lines 30-34):**
```
1. Is variant-level discount active? → Use variant discount
2. Else, is product-level discount active? → Use product discount
3. Else, return base price
```

**Test Cases:**

| Scenario | Variant Discount | Product Discount | Expected | Code Path | Status |
|----------|-----------------|-----------------|----------|-----------|--------|
| Both active | Yes (10%) | Yes (5%) | Variant wins (10%) | Line 30-31 | ✅ Correct |
| Only variant | Yes (10%) | No | Variant (10%) | Line 30-31 | ✅ Correct |
| Only product | No | Yes (5%) | Product (5%) | Line 32-33 | ✅ Correct |
| Neither | No | No | Base price | Line 29 | ✅ Correct |
| Variant active, product pending | Active | Future start | Variant | Line 30-31 | ✅ Correct |
| Variant expired, product active | Expired | Active | Product | Line 32-33 | ✅ Correct |
| Product is nil | Yes (10%) | N/A (nil) | Variant (10%) | Line 30-31 | ✅ Correct (safe nil check) |

**STRONG POINT:** Proper nil safety — line 32 checks `p != nil` before using.

---

### 3. `cart_service.go` — AddItem() Effective Price Computation

**Price Computation Flow (lines 88-101):**

**Case A: No variant specified (default product price)**
```go
priceAtAdd := product.DefaultPrice
// Apply product-level discount if active
if IsDiscountActive(product.DiscountPercent, ...) {
  priceAtAdd = EffectivePrice(...)
}
```
- ✅ Correct

**Case B: Variant specified**
```go
if req.AttrID != "" {
  v, err := variantRepo.FindVariantByID(...)
  if err == nil && v != nil && v.ProductID == product.ID {
    priceAtAdd = v.Price
    // Try variant discount first
    if IsDiscountActive(v.DiscountPercent, ...) {
      priceAtAdd = EffectivePrice(v.Price, v.DiscountPercent, ...)
    } 
    // Fallback to product discount
    else if IsDiscountActive(product.DiscountPercent, ...) {
      priceAtAdd = EffectivePrice(v.Price, product.DiscountPercent, ...)
    }
  }
}
```
- ✅ **Correct:** Variant discount takes precedence over product discount
- ✅ **Safe:** Checks `v.ProductID == product.ID` (prevents cross-product variant attacks)
- ✅ **Safe:** Handles variant lookup errors gracefully (ignores if not found)

**Edge Case Analysis:**

| Scenario | Code Behavior | Status |
|----------|---------------|--------|
| Variant not found in DB | Falls through, uses product.DefaultPrice | ⚠️ SILENT FALLBACK (no error) |
| Variant belongs to wrong product | Security check prevents use | ✅ Secure |
| AttrID empty string | Uses product price | ✅ Correct |
| Product not found (line 66-72) | Returns error | ✅ Correct |
| Invalid quantity | No validation | ⚠️ UNTESTED (could be 0 or negative) |
| Cart not found | FindOrCreateCart handles it | ✅ Correct |
| Existing cart item update | Quantity accumulated correctly | ✅ Correct (line 80) |

**CONCERN:** Variant lookup failure (line 90: `if err == nil && v != nil`) silently uses product price. No error logged. This is safe but masks data consistency issues.

---

### 4. Database Schema

**Migrations applied:**
- `000013_add_discount_to_products.up.sql` — Products table
  - `discount_percent NUMERIC(5,2)` DEFAULT 0
  - `discount_start_at TIMESTAMPTZ` NULL
  - `discount_end_at TIMESTAMPTZ` NULL
  - Index on `discount_percent > 0`

- `000014_add_discount_to_variants.up.sql` — ProductVariants table
  - Same structure as products
  - Proper default values (0)

✅ Schema is clean, properly indexed

---

### 5. Frontend Integration

**Type Definitions (types/api.ts):**
- ✅ `Product` interface includes `discount_percent`, `discount_start_at`, `discount_end_at`, `sale_price`
- ✅ `ProductVariant` interface has same fields
- ✅ Payloads support discount fields (lines 174-218)

**Frontend Components Using Discounts:**
1. `ProductCard.tsx` — Shows discount percentage badge
2. `ProductItem.tsx` — Optional discount display
3. `product-info-panel.tsx` (admin) — Full discount CRUD
4. `shop/page.tsx` — Passes `discountPercent` to ProductItem
5. `product/[id]/page.tsx` — Calculates discount percentage dynamically

**Date Handling:**
- ✅ Conversions between ISO 8601 and local datetime
- `toDatetimeLocal()` used in admin forms
- `fromDatetimeLocal()` converts back to ISO string

---

## Critical Gaps

### 1. **Zero Unit Tests — Backend**
- No test files found in `src/internal/`
- All 13 packages have `[no test files]`
- **Impact:** Cannot verify:
  - Edge cases (boundary times, zero percent, nil pointers)
  - Error scenarios (DB errors, malformed data)
  - Race conditions (concurrent cart operations)
  - Integration between discount logic and repositories

**Recommendation:** Create test suite:
```
backend/src/internal/dto/discount_helper_test.go
backend/src/internal/dto/product_variant_dto_test.go
backend/src/internal/services/cart_service_test.go
```

### 2. **No Frontend Test Configuration**
- No Jest/Vitest setup
- No component tests for discount display logic
- **Impact:** Cannot verify:
  - Discount badge rendering conditions
  - Price calculations in UI
  - Date formatting edge cases
  - Responsive behavior

### 3. **Silent Failures in cart_service.AddItem()**
- Variant lookup error (line 90) silently ignored
- No logging when AttrID specifies non-existent variant
- **Risk:** Customer adds cart item with invalid variant, receives wrong price silently

**Recommendation:** Log variant lookup failures:
```go
if err != nil {
  log.Warnf("variant lookup failed for ID %s: %v", req.AttrID, err)
}
```

### 4. **Quantity Validation Missing**
- No check for negative or zero quantities in AddItem()
- Could allow invalid cart states

**Recommendation:** Validate in requests layer:
```go
if req.Quantity <= 0 {
  return ErrInvalidQuantity
}
```

### 5. **End Time Boundary Behavior Undocumented**
- Discount expires AT `end_at` time, not AFTER
- Relying on `time.After()` semantics
- **Risk:** Customers lose discount at exact end time (may be unexpected)

**Recommendation:** Document or use inclusive boundary:
```go
if end != nil && now.After(*end) {  // Current: strict >
  // Consider: inclusive >= 
}
```

---

## Test Coverage Summary

| Component | Coverage | Status |
|-----------|----------|--------|
| `IsDiscountActive()` | 0% | UNTESTED |
| `EffectivePrice()` | 0% | UNTESTED |
| `ToVariantDTOWithProduct()` | 0% | UNTESTED |
| `AddItem()` pricing logic | 0% | UNTESTED |
| `UpdateItem()` quantity | 0% | UNTESTED |
| `RemoveItem()` validation | 0% | UNTESTED |
| Frontend discount rendering | 0% | UNTESTED |
| Admin discount forms | 0% | UNTESTED |

**Overall Coverage: 0%**

---

## Build & Deployment Readiness

| Check | Status | Notes |
|-------|--------|-------|
| Backend compiles | ✅ | Clean build |
| Frontend TypeScript | ✅ | No type errors |
| Database schema | ✅ | Migrations are backward-compatible |
| API contracts | ✅ | Frontend types match backend DTOs |
| Backward compat | ✅ | Discount fields optional (default 0) |

**Deployment Risk: MEDIUM** — Code quality is acceptable, but complete lack of tests creates risk for edge cases and integration issues.

---

## Recommendations (Priority Order)

### P0 — Must Fix Before Merge
1. **Create discount_helper_test.go**
   - Test `IsDiscountActive()` with all 9 edge cases (nil times, zero/negative percent, boundary times)
   - Test `EffectivePrice()` calculation accuracy
   - Expected: 15–20 test cases

2. **Create cart_service_test.go (pricing path)**
   - Mock repositories
   - Test variant discount precedence over product discount
   - Test fallback when variant not found
   - Test accumulation of existing items
   - Expected: 10–15 test cases

3. **Validate quantity in AddItem()**
   - Add check: `if req.Quantity <= 0 { return ErrInvalidQuantity }`
   - Update cart_service_test.go to verify

### P1 — Should Add Before Release
4. **Create product_variant_dto_test.go**
   - Test fallback hierarchy (variant → product → base)
   - Test nil product safety
   - Expected: 8–10 test cases

5. **Add logging to variant lookup failures**
   - Line 90: Log when variant not found or doesn't match product

6. **Create frontend component tests**
   - Test `ProductItem` discount badge visibility
   - Test `product-info-panel` form state management
   - Use Jest/Vitest (setup required)

### P2 — Nice to Have
7. **Document end_at boundary behavior**
   - Add code comment explaining strict inequality
   - Consider inclusive boundary if user feedback suggests confusion

8. **Add integration tests**
   - E2E: Create product with discount → Add to cart → Verify price
   - Requires Docker compose setup with real DB

---

## Unresolved Questions

1. **Negative percent values** — Should backend reject `-5%` discount? Currently returns false (safe), but API validation layer not checked.
2. **Precision loss** — NUMERIC(5,2) stores 999.99 max. Is this sufficient for all use cases, or should it be (10,2)?
3. **Timezone handling** — Discount times are stored as TIMESTAMPTZ. Are admin clients aware that times should be in their timezone or UTC?
4. **Concurrent discount updates** — If admin updates discount while AddItem() is executing, could race condition cause stale discount data? (Optimistic lock pattern not detected)
5. **Variant image fallback** — If variant.Avatar is empty, UI should show product.Avatar. Is this handled in API response or frontend?

---

## Summary

**Positive:**
- ✅ Code compiles cleanly
- ✅ No syntax or type errors
- ✅ Schema is correct and indexed
- ✅ Discount hierarchy logic is sound
- ✅ Nil safety is present
- ✅ Security check (product.ID validation) in place

**Critical Issues:**
- ❌ **ZERO TEST COVERAGE** across all discount logic
- ❌ Silent variant lookup failures in cart service
- ❌ No quantity validation
- ⚠️ Undocumented end_at boundary behavior

**Status:** **DONE_WITH_CONCERNS**

The discount feature implementation is functionally correct but **completely untested**. Code quality is acceptable for production, but the complete absence of unit tests creates risk for edge cases, data inconsistencies, and future regressions. **Cannot recommend merge without test suite.**

