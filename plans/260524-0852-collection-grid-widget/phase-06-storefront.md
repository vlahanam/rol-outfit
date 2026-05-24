# Phase 6: Storefront Dynamic Data

**Status:** pending  
**Est:** 25 min  
**Priority:** medium

## Overview

Replace hardcoded CollectionCards trên homepage với dynamic data từ widget API.

## Requirements

- Fetch widget type `collection-grid` từ API
- Render CollectionCards từ widget metadata
- Handle empty state
- Maintain existing layout (grid 4 cols)
- Keep navigation buttons (future: implement scroll)

## Related Files

| File | Action |
|------|--------|
| `frontend/app/[locale]/(main)/page.tsx` | Modify |
| `frontend/components/storefront/collection-grid.tsx` | Create (optional) |
| `frontend/lib/api-server.ts` | Verify |

## Implementation

### Option A: Direct in page.tsx (Recommended - KISS)

```tsx
// frontend/app/[locale]/(main)/page.tsx

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  // Existing banner fetch
  const bannerWidgets = await fetchWidgets("banner-slider");
  // ...

  // New: Fetch collection grid
  const collectionWidgets = await fetchWidgets("collection-grid");
  const collectionWidget = collectionWidgets[0];
  const collectionItems = collectionWidget
    ? ((collectionWidget.metadata as CollectionGridMetadata)?.items ?? [])
    : [];

  return (
    <>
      {/* Banner section (existing) */}

      {/* Special Collections section */}
      {collectionItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("specialCollections")}
            </h2>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px]">
            {collectionItems.slice(0, 4).map((item) => (
              <CollectionCard
                key={item.id}
                title={item.title}
                image={item.image}
                link={item.link}
                ctaText={item.cta_text}
              />
            ))}
          </div>
        </section>
      )}

      {/* Rest of page */}
    </>
  );
}
```

### Option B: Separate Component (if want scroll functionality)

Create `frontend/components/storefront/collection-grid.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CollectionCard } from "@/components/CollectionCard";
import type { CollectionItem } from "@/types/api";

interface Props {
  items: CollectionItem[];
  title: string;
}

export function CollectionGrid({ items, title }: Props) {
  const [offset, setOffset] = useState(0);
  const visibleCount = 4;
  const canScrollLeft = offset > 0;
  const canScrollRight = offset + visibleCount < items.length;

  const visibleItems = items.slice(offset, offset + visibleCount);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={!canScrollLeft}
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setOffset((o) => Math.min(items.length - visibleCount, o + 1))}
            disabled={!canScrollRight}
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px]">
        {visibleItems.map((item) => (
          <CollectionCard
            key={item.id}
            title={item.title}
            image={item.image}
          />
        ))}
      </div>
    </section>
  );
}
```

### CollectionCard Update (if needed)

Current CollectionCard accepts: `title`, `image`, `span`

May need to add: `link`, `ctaText` props

```tsx
// frontend/components/CollectionCard.tsx
interface CollectionCardProps {
  title: string;
  image: string;
  link?: string;
  ctaText?: string;
  span?: string;
}

export function CollectionCard({ title, image, link, ctaText = "Mua Ngay", span }: CollectionCardProps) {
  const content = (
    <div className={`relative overflow-hidden rounded-lg group cursor-pointer h-full ${span || ''}`}>
      {/* ... existing content ... */}
      <button className="flex items-center gap-1 text-sm hover:gap-2 transition-all">
        {ctaText} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}
```

## Todo

- [ ] Add import for CollectionGridMetadata in page.tsx
- [ ] Fetch collection-grid widget data
- [ ] Replace hardcoded CollectionCards with dynamic data
- [ ] Handle empty state (hide section or show placeholder)
- [ ] Update CollectionCard to accept link and ctaText props
- [ ] (Optional) Create CollectionGrid component for scroll functionality
- [ ] Test with 0, 1-4, >4 items

## Success Criteria

- [ ] Homepage shows collections from widget data
- [ ] No hardcoded collection data
- [ ] Empty widget = section hidden
- [ ] Links work correctly
- [ ] Layout unchanged from current

## Edge Cases

| Case | Handling |
|------|----------|
| No active widget | Hide section |
| Empty items array | Hide section |
| <4 items | Show available items |
| >4 items | Show first 4 (or implement scroll) |
| Missing image | Fallback gradient |
