# Phase 1: Types Setup

**Status:** completed  
**Effort:** 15m  
**Priority:** high

## Overview

Add `TrendHotSettings` type và type aliases cho trend-hot widget.

## Files to Modify

| File | Action |
|------|--------|
| `frontend/types/api.ts` | ADD types |

## Implementation

### 1. Add TrendHotSettings to `types/api.ts`

After `CollectionGridSettings` (~line 280), add:

```typescript
// Trend Hot Widget (reuses CollectionItem for items)
export type TrendHotMetadata = CollectionGridMetadata; // { items: CollectionItem[] }

export interface TrendHotSettings {
  cardHeight?: number;  // pixels, default 400
  showBadge?: boolean;  // show "HOT" badge on cards
}
```

## Todo

- [ ] Add TrendHotMetadata type alias
- [ ] Add TrendHotSettings interface
- [ ] Verify no TypeScript errors

## Success Criteria

- Types compile without errors
- Types available for import in other files
