# Phase 1: Display Sold Quantity

## Context Links
- Product detail page: `/frontend/app/[locale]/(main)/product/[id]/page.tsx`
- API types: `/frontend/types/api.ts` (ProductVariant has `sold: number`)
- Backend variant model: `/backend/src/internal/models/product_variant.go` (Sold field exists)

## Overview
- **Priority:** P1 (simplest, immediate value)
- **Status:** pending
- **Effort:** 30 minutes

Display the sold quantity on product detail page. Data already exists in `product_variants.sold` and is returned by API.

## Key Insights
- `ProductVariant.sold` already in API response (confirmed in `types/api.ts` line 110)
- Frontend already calculates `totalStock` by summing variant stocks
- Same pattern can display `totalSold` by summing variant sold counts

## Requirements

### Functional
- Show total sold count below/next to stock info
- Format: "Da ban: X" (Vietnamese) or localized equivalent

### Non-Functional
- No additional API calls needed
- Instant implementation

## Architecture

**Data Flow:**
```
product_variants.sold (DB) 
  -> GET /api/v1/products/:id/variants 
  -> ProductVariant[] response 
  -> Sum sold values in frontend 
  -> Display
```

## Related Code Files

### Files to Modify
- `frontend/app/[locale]/(main)/product/[id]/page.tsx`

### Files to Read (Context)
- `frontend/types/api.ts`

## Implementation Steps

1. **Add totalSold calculation** (similar to existing totalStock):
   ```typescript
   const totalSold = useMemo(
     () => variants.reduce((s, v) => s + (v.sold ?? 0), 0),
     [variants],
   );
   ```

2. **Display sold count** (near stockText display, ~line 284):
   ```typescript
   {hasVariants && totalSold > 0 && (
     <p className="text-sm text-gray-500 mt-1">
       {t("sold", { count: totalSold })}
     </p>
   )}
   ```

3. **Add translation key** in localization files:
   - `frontend/messages/vi.json`: `"sold": "Da ban: {count}"`
   - `frontend/messages/ja.json`: `"sold": "{count} 個販売済み"`

## Todo List
- [ ] Add `totalSold` useMemo calculation
- [ ] Add sold display UI element
- [ ] Add translation keys for "sold" text
- [ ] Test with products that have sold > 0

## Success Criteria
- [ ] Product detail shows "Da ban: X" when variants have sold > 0
- [ ] Correctly sums sold from all variants
- [ ] Displays in user's selected locale

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| sold=0 for all test products | Medium | Low | Manually update DB or use seed data |

## Security Considerations
- None — read-only display of existing public data
