# New Product Widget Implementation ("Hàng Mới Về")

**Date:** 2026-05-25  
**Status:** Completed  
**Duration:** ~4 hours across 3 phases

## Summary

Implemented configurable "New Products" widget replacing hardcoded product lists on homepage. Backend supports multi-tag filtering with OR logic; frontend provides admin editor with real-time preview; homepage integration includes graceful fallback when no widget configured.

## Key Changes

- **Backend:** Extended `GET /products` to support `?tags=slug1,slug2` filter (OR logic) with GROUP BY for correct product count
- **Frontend Editor:** `NewProductEditor` component—tag selector with live product count feedback
- **Frontend Preview:** `NewProductPreview`—real-time product grid showing selected tags
- **Homepage:** Replaced hardcoded product list with widget-driven API fetch + fallback

**Files modified:** 11 total
- Backend: 3 Go files (products handler, service layer, database query)
- Frontend: 8 TS/TSX files (editor, preview, types, homepage integration)

## Technical Decisions

1. **Multi-tag OR Logic:** `GROUP BY product_id HAVING COUNT(*) > 0` avoids COUNT DISTINCT pitfall that was causing inflated row counts. Maintains backward compatibility with single `?tag=` param.

2. **Server-Side Caching (ISR):** 60s products revalidation + 300s tags revalidation. Balances admin responsiveness against API load.

3. **Widget Fallback:** If no widget configured, homepage renders nothing rather than crashing. Admin must explicitly create widget to show products.

## Issues Resolved

- **Code Review Finding:** COUNT DISTINCT was incorrectly computing product counts when joining multiple tag rows. Fixed by switching to GROUP BY approach—cleaner, more performant.

## Impact

- Admins can now create unlimited product sections by tag (previously 1 hardcoded list)
- Product filtering supports multi-tag discovery (e.g., "Summer + Sale" products)
- Homepage remains stable even if widget service fails (graceful degradation)

## Concerns

- Widget visibility requires explicit admin action; no default "show all new products" if misconfigured
- Tag filtering is case-sensitive (slug matching)—document in admin guide

## Next Steps

- Monitor widget load times in production (target <200ms for homepage fetch)
- Add admin preview of which products match selected tags before saving
- Consider telemetry on which tag combinations drive most clicks
