---
phase: 1
title: Types & API Update
status: completed
effort: 10 min
---

# Phase 1 – Types & API Update

## Context Links
- `frontend/types/api.ts` — Widget types
- `frontend/lib/api-resources.ts` — `adminWidgets.update()`

## Overview

Thêm TypeScript types cho banner slider metadata và cập nhật `UpdateWidgetPayload` để frontend có thể gửi metadata khi save.

## Related Code Files

**Modify:**
- `frontend/types/api.ts`

**Read-only context:**
- `frontend/lib/api-resources.ts` (không cần sửa — `UpdateWidgetPayload` update đủ)

## Implementation Steps

### 1. `frontend/types/api.ts`

Thêm sau `// Widget` section (sau `WidgetType` và `Widget` interfaces):

```typescript
export interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
}

export interface BannerSliderMetadata {
  slides: BannerSlide[];
}
```

Cập nhật `UpdateWidgetPayload`:

```typescript
export interface UpdateWidgetPayload {
  name?: string;
  display_order?: number;
  status?: number;
  metadata?: Record<string, unknown>;  // ADD THIS
}
```

## Todo List

- [x] Add `BannerSlide` interface
- [x] Add `BannerSliderMetadata` interface
- [x] Add `metadata?` to `UpdateWidgetPayload`

## Success Criteria

- TypeScript compiles without errors
- `api.adminWidgets.update(id, { ..., metadata: { slides: [...] } })` type-checks correctly
