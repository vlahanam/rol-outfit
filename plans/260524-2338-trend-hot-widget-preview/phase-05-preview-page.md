# Phase 5: Preview Page Route

**Status:** completed  
**Effort:** 45m  
**Priority:** high

## Overview

Create `/preview` page that receives widget data via postMessage and renders the appropriate widget component.

## Files to Create

| File | Lines |
|------|-------|
| `frontend/app/preview/page.tsx` | ~60 |

## Implementation

### Page Structure

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CollectionSlider } from "@/components/storefront/collection-slider";
import type { CollectionItem } from "@/types/api";

interface PreviewData {
  items: CollectionItem[];
  settings?: {
    cardHeight?: number;
    showBadge?: boolean;
  };
}

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const widgetType = searchParams.get("widget");
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    // Notify parent that iframe is ready
    window.parent.postMessage({ type: "preview-ready" }, "*");

    const handleMessage = (event: MessageEvent) => {
      // Security: only accept from same origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "preview-data") {
        setData(event.data.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang chờ dữ liệu...</p>
      </div>
    );
  }

  // Render based on widget type
  if (widgetType === "trend-hot") {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <CollectionSlider
          items={data.items}
          title="Xu Hướng Hot"
          cardHeight={data.settings?.cardHeight ?? 400}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">Unknown widget type: {widgetType}</p>
    </div>
  );
}
```

### Key Points

1. **No layout** - Page renders standalone, no header/footer
2. **postMessage ready** - Immediately signals parent on mount
3. **Security** - Origin check on message receive
4. **Widget rendering** - Uses existing CollectionSlider component
5. **Fallback** - Shows loading/error states

### Route Config

Create `frontend/app/preview/layout.tsx` if needed to remove default layout:

```typescript
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

## Todo

- [ ] Create app/preview/page.tsx
- [ ] Add postMessage listener
- [ ] Send ready signal on mount
- [ ] Render CollectionSlider for trend-hot
- [ ] Handle loading state
- [ ] Test iframe communication

## Success Criteria

- Page loads at /preview?widget=trend-hot
- Receives data via postMessage
- Renders CollectionSlider correctly
- No header/footer interference
