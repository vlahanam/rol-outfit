# Database Seed Script + Slugify Unicode Normalization Fix

**Date**: 2026-04-28 00:30
**Severity**: High
**Component**: Seeder, common.Slugify()
**Status**: Resolved

## What Happened

Implemented a database seed script (`backend/src/cmd/seed/main.go`) to populate dev environment with test data: 1 admin + 2 customer users, 4 categories, 12 products. During code review, discovered the underlying `Slugify()` function was silently corrupting Vietnamese product names during category lookups.

## The Brutal Truth

The seeder would hit GORM's `Where("slug = ?", slug).First()` queries and get zero results because the slug being searched didn't match what was actually stored. "Áo Nam" (Men's Shirt) was stored as "ao-nam" but the old Slugify was converting it to "o-nam" — stripping the entire "Á" character instead of normalizing it. Silent lookup failures are the worst kind of bug because there's no error, just wrong behavior.

## Technical Details

**Old code** (broken):
```go
normalized = strings.ToLower(normalized)
normalized = nonAlphanumeric.ReplaceAllString(normalized, "-")
```

Characters like "Á" (U+00C1) are non-ASCII, so they were being stripped entirely instead of decomposed to "A" + combining acute accent, then the combining mark removed, leaving clean ASCII "A".

**New code** (fixed):
```go
normalizer = transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
normalized, _, _ := transform.String(normalizer, s)
normalized = strings.ToLower(normalized)
normalized = nonAlphanumeric.ReplaceAllString(normalized, "-")
```

Uses Unicode Normalization Form D (NFD) to decompose accented characters, removes combining marks, recomposes via NFC. Result: "Áo Nam" → "ao-nam" (correct) instead of "o-nam" (broken).

## Root Cause Analysis

Original `Slugify()` was written without testing against Vietnamese names. The regex `[^a-z0-9]+` assumes pre-normalized ASCII, but Vietnamese text needs Unicode decomposition first. This wasn't caught until the seeder started trying to look up categories by their Vietnamese names.

## Lessons Learned

1. **Test with actual data early** — The bug existed in the codebase for multiple commits. Would have been caught immediately if we'd seeded with Vietnamese names from day one.

2. **Unicode handling is implicit, not accidental** — Assuming ASCII-only slug functions will eventually bite projects targeting non-English markets.

3. **Silent lookup failures are dangerous** — No error was thrown; the seeder just created orphaned products. Add validation logs when database queries return empty unexpectedly.

## Next Steps

- Seed script now runs via `make seed` and is idempotent (checks by email/slug, logs skips)
- GORM logger set to Warn level in seed binary to prevent bcrypt hashes appearing in compose logs
- Slugify fix applies retroactively to all callers: categories, products service, and future API routes
- Vietnamese product names now have human-readable slugs in the API

**Files modified:**
- `/backend/src/internal/common/slug.go` — Added Unicode normalization
- `/backend/src/cmd/seed/main.go` — New seed entry point
- `Makefile` — Added `make seed` target
