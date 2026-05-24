# Phase 4: FullPagePreviewModal Component

**Status:** completed  
**Effort:** 45m  
**Priority:** high

## Overview

Create full-screen modal with iframe for homepage-like preview. Uses postMessage for data communication.

## Files to Create

| File | Lines |
|------|-------|
| `frontend/components/admin/widgets/full-page-preview-modal.tsx` | ~80 |

## Implementation

### Component Structure

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  data: {
    items: unknown[];
    settings?: Record<string, unknown>;
  };
}

export function FullPagePreviewModal({ isOpen, onClose, widgetType, data }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Security: check origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "preview-ready") {
        // Iframe ready, send data
        iframeRef.current?.contentWindow?.postMessage(
          { type: "preview-data", widgetType, data },
          window.location.origin
        );
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, widgetType, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Đang tải preview...</div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={`/preview?widget=${widgetType}`}
        className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
```

### PostMessage Protocol

1. **Modal opens** → loads iframe `/preview?widget=trend-hot`
2. **Iframe ready** → sends `{ type: "preview-ready" }`
3. **Modal receives** → sends `{ type: "preview-data", widgetType, data }`
4. **Iframe renders** → displays widget with received data

### Security

- Origin check on message receive
- Iframe sandbox: `allow-scripts allow-same-origin`
- No external data exposure

## Todo

- [ ] Create full-page-preview-modal.tsx
- [ ] Add postMessage listener
- [ ] Add loading state
- [ ] Add close button
- [ ] Style modal overlay
- [ ] Test iframe loading

## Success Criteria

- Modal opens/closes correctly
- Iframe loads preview page
- postMessage communication works
- Loading state shows while iframe loads
