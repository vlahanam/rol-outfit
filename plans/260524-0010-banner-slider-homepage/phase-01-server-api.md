# Phase 1: Server-side API Utility

**Status:** completed  
**Est:** 15 min  
**Completed:** 2026-05-24

## Overview

Tạo utility fetch widgets từ server component với ISR caching.

## File: `frontend/lib/api-server.ts`

```typescript
const API_BASE = process.env.INTERNAL_API_URL || "http://backend:8080/api/v1";

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
}

export async function fetchFromAPI<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { revalidate = 60, tags } = options;
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate, tags },
    });
    
    if (!res.ok) return null;
    
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchWidgets(type?: string) {
  const path = "/widgets?limit=50";
  const widgets = await fetchFromAPI<Widget[]>(path, { 
    revalidate: 60,
    tags: ["widgets"]
  });
  
  if (!widgets) return [];
  
  return type 
    ? widgets.filter(w => w.type === type)
    : widgets;
}
```

## Key Points

- `INTERNAL_API_URL` cho Docker internal network (backend:8080)
- ISR 60s via `next: { revalidate }`
- Tags cho on-demand revalidation nếu cần sau này
- Return `null` on error, let caller handle

## Environment

Add to `frontend/.env.local`:
```
INTERNAL_API_URL=http://backend:8080/api/v1
```

## TODO

- [x] Create `frontend/lib/api-server.ts`
- [x] Add `INTERNAL_API_URL` to `.env.local` (if not exists)
- [x] Verify fetch works from server component
