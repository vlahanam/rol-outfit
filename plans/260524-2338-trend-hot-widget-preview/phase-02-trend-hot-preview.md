# Phase 2: TrendHotPreview Component

**Status:** completed  
**Effort:** 1h  
**Priority:** high

## Overview

Create inline preview component với device toggle, scroll controls, active highlight, và full-preview button.

## Files to Create

| File | Lines |
|------|-------|
| `frontend/components/admin/widgets/trend-hot-preview.tsx` | ~150 |

## Reference

Copy pattern from `collection-grid-preview.tsx` với modifications:
- Add "Full Preview" button
- Style cards như TrendingCard (aspect-[3/4])

## Implementation

### Component Structure

```typescript
"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Monitor, Smartphone, ChevronLeft, ChevronRight, ArrowRight, Maximize2 } from "lucide-react";
import type { CollectionItem } from "@/types/api";

type DeviceMode = "desktop" | "mobile";

interface Props {
  items: CollectionItem[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  cardHeight?: number;
  showBadge?: boolean;
  onFullPreview?: () => void;  // NEW: trigger full-page modal
}
```

### Key Features

1. **Device Toggle** - Desktop/Mobile buttons switching aspect ratios
2. **Scroll Controls** - Left/right chevron buttons
3. **Active Highlight** - Blue ring + "Đang sửa" badge
4. **Full Preview Button** - Maximize2 icon, calls `onFullPreview`
5. **Card Style** - aspect-[3/4] like TrendingCard, not square

### Card Rendering

```tsx
<div
  style={{ height: previewHeight, width: cardWidth }}
  className={`relative rounded-lg overflow-hidden cursor-pointer group ${
    i === activeIndex ? "ring-2 ring-blue-500 ring-offset-2" : ""
  }`}
>
  {/* Image */}
  <Image src={item.image} alt={item.title} fill className="object-cover" />
  
  {/* Gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
  
  {/* Content */}
  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
    <h3 className="font-bold text-sm mb-1">{item.title}</h3>
    <span className="text-xs flex items-center gap-1">
      {item.cta_text || "Khám Phá"} <ArrowRight className="w-3 h-3" />
    </span>
  </div>
  
  {/* HOT badge (optional) */}
  {showBadge && (
    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
      HOT
    </div>
  )}
  
  {/* Active badge */}
  {i === activeIndex && (
    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
      Đang sửa
    </div>
  )}
</div>
```

### Header with Full Preview Button

```tsx
<div className="flex items-center justify-between">
  <p className="text-xs font-medium text-gray-500 uppercase">Preview</p>
  <div className="flex items-center gap-3">
    {/* Scroll controls */}
    {/* Device toggle */}
    
    {/* Full Preview button */}
    {onFullPreview && (
      <button
        type="button"
        onClick={onFullPreview}
        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        title="Xem toàn trang"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
```

## Todo

- [ ] Create trend-hot-preview.tsx
- [ ] Import lucide icons
- [ ] Add device toggle state
- [ ] Add scroll functionality
- [ ] Add active highlight
- [ ] Add Full Preview button
- [ ] Test rendering with sample data

## Success Criteria

- Component renders without errors
- Device toggle switches card sizes
- Scroll buttons work
- Click selects item
- Full Preview button triggers callback
