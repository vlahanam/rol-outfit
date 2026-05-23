# Phase 3: Homepage Integration

**Status:** completed  
**Est:** 20 min  
**Completed:** 2026-05-24

## Overview

Fetch banner slider widget từ server và render trên homepage trước section "Special Collections".

## File: `frontend/app/[locale]/(main)/page.tsx`

### Changes

```typescript
// Add imports
import { fetchWidgets } from "@/lib/api-server";
import { BannerSlider } from "@/components/storefront/banner-slider";
import type { Widget, BannerSliderMetadata } from "@/types/api";

export default async function HomePage() {
  const t = await getTranslations("HomePage");
  
  // Fetch banner slider widget
  const widgets = await fetchWidgets("banner-slider");
  const bannerWidget = widgets[0] as Widget | undefined;
  const slides = bannerWidget 
    ? (bannerWidget.metadata as BannerSliderMetadata)?.slides ?? []
    : [];

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Banner Slider Section */}
        {slides.length > 0 && (
          <section className="mb-12">
            <BannerSlider slides={slides} />
          </section>
        )}

        {/* Existing: Special Collections */}
        <section className="mb-12">
          {/* ... existing code ... */}
        </section>

        {/* ... rest of page ... */}
      </main>
      <Footer />
    </>
  );
}
```

### Key Points

1. **Server-side fetch** - `fetchWidgets()` chạy ở server, ISR 60s
2. **Type safety** - Cast `metadata` sang `BannerSliderMetadata`
3. **Conditional render** - Chỉ render nếu có slides
4. **Position** - Đặt trước "Special Collections"

## Data Flow

```
1. Request → page.tsx (server)
2. fetchWidgets("banner-slider") → API
3. Filter first widget, extract slides
4. Pass to <BannerSlider /> (client component)
5. Hydration enables interactivity
```

## TODO

- [x] Import `fetchWidgets` và `BannerSlider`
- [x] Add banner slider section trước Special Collections
- [x] Test render với widget từ admin
- [x] Verify ISR hoạt động (check headers)
- [x] Test fallback khi không có widget
