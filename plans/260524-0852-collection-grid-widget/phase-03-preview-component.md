# Phase 3: Preview Component

**Status:** pending  
**Est:** 30 min  
**Priority:** high

## Overview

Create `collection-grid-preview.tsx` component showing grid của items với navigation và device toggle.

## Requirements

- Grid 4 cột (desktop), 2 cột (mobile)
- Horizontal scroll với chevron buttons khi >4 items
- Desktop/Mobile device toggle
- Click item để select trong editor
- Reuse CollectionCard styling

## Related Files

| File | Action |
|------|--------|
| `frontend/components/admin/widgets/collection-grid-preview.tsx` | Create |
| `frontend/components/admin/widgets/banner-slider-preview.tsx` | Reference |
| `frontend/components/CollectionCard.tsx` | Reference |

## Implementation

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Preview                                    [Desktop] [Mobile]│
├─────────────────────────────────────────────────────────────┤
│  ◀ │ [Card 1] [Card 2] [Card 3] [Card 4] │ ▶               │
└─────────────────────────────────────────────────────────────┘
```

### Props Interface

```typescript
interface Props {
  items: CollectionItem[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}
```

### Key Features

1. **Device Mode Toggle**
   - Desktop: 4 columns, h-[300px]
   - Mobile: 2 columns, h-[200px]

2. **Navigation**
   - Show chevrons when items.length > visible columns
   - Track scroll position with useState
   - Scroll by 1 item on click

3. **Item Selection**
   - Highlight active item với ring
   - Click to select (calls onActiveChange)

4. **Card Rendering**
   - Image với object-cover
   - Title overlay
   - CTA text với arrow icon

### Code Template

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Monitor, Smartphone, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { CollectionItem } from "@/types/api";

type DeviceMode = "desktop" | "mobile";

interface Props {
  items: CollectionItem[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function CollectionGridPreview({ items, activeIndex, onActiveChange }: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [scrollOffset, setScrollOffset] = useState(0);
  
  const isMobile = deviceMode === "mobile";
  const visibleCount = isMobile ? 2 : 4;
  const canScrollLeft = scrollOffset > 0;
  const canScrollRight = scrollOffset + visibleCount < items.length;
  
  const visibleItems = items.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <div className="space-y-2">
      {/* Header with device toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {/* Desktop/Mobile buttons - same as banner-slider */}
        </div>
      </div>

      {/* Grid container */}
      <div className="relative">
        {/* Left nav */}
        {canScrollLeft && (
          <button onClick={() => setScrollOffset(o => o - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 ...">
            <ChevronLeft />
          </button>
        )}

        {/* Grid */}
        <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {visibleItems.map((item, i) => (
            <div
              key={item.id}
              onClick={() => onActiveChange(scrollOffset + i)}
              className={`relative rounded-lg overflow-hidden cursor-pointer h-[200px] ${
                scrollOffset + i === activeIndex ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* Card content */}
            </div>
          ))}
        </div>

        {/* Right nav */}
        {canScrollRight && (
          <button onClick={() => setScrollOffset(o => o + 1)} className="absolute right-0 ...">
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}
```

## Todo

- [ ] Create `collection-grid-preview.tsx`
- [ ] Implement device mode toggle (copy from banner-slider)
- [ ] Implement grid display with visible items slice
- [ ] Add scroll navigation buttons
- [ ] Add active item highlight (ring-2 ring-blue-500)
- [ ] Handle empty state
- [ ] Test with 1-8 items

## Success Criteria

- [ ] Preview renders items in grid
- [ ] Device toggle switches between 4/2 columns
- [ ] Navigation scrolls through items
- [ ] Click selects item
- [ ] Active item highlighted
