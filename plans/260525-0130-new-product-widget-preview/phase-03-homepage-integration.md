# Phase 3: Homepage Integration

**Status:** complete  
**Priority:** medium  
**Estimated:** 1 hour  
**Depends on:** Phase 1, Phase 2  
**Optional:** Yes (can be deferred)

## Overview

Replace hardcoded "Hàng Mới Về" section on homepage with widget-driven product fetch.

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/lib/api-server.ts` | Add `fetchProductsByTags()` |
| `frontend/app/[locale]/(main)/page.tsx` | Replace hardcoded products |

## Implementation Steps

### 1. Add Server-Side Products Fetch

**File:** `frontend/lib/api-server.ts`

```typescript
import type { Widget, Product, NewProductMetadata, NewProductSettings, Tag } from "@/types/api";

export async function fetchProductsByTags(
  tagIds: string[],
  limit: number = 10
): Promise<Product[]> {
  if (tagIds.length === 0) return [];

  // First fetch tags to get slugs
  const tags = await fetchFromAPI<Tag[]>("/admin/tags?limit=100", { revalidate: 300 });
  if (!tags) return [];

  const slugs = tagIds
    .map((id) => tags.find((t) => t.id === id)?.slug)
    .filter(Boolean);

  if (slugs.length === 0) return [];

  const products = await fetchFromAPI<Product[]>(
    `/products?tags=${slugs.join(",")}&limit=${limit}`,
    { revalidate: 60, tags: ["products"] }
  );

  return products ?? [];
}

export async function fetchNewProductWidget(): Promise<{
  widget: Widget | null;
  products: Product[];
}> {
  const widgets = await fetchWidgets("new-product");
  const widget = widgets[0] ?? null;

  if (!widget) return { widget: null, products: [] };

  const meta = widget.metadata as NewProductMetadata | null;
  const settings = widget.settings as NewProductSettings | null;

  const tagIds = meta?.tag_ids ?? [];
  const limit = settings?.quantity ?? 10;

  const products = await fetchProductsByTags(tagIds, limit);

  return { widget, products };
}
```

### 2. Update Homepage

**File:** `frontend/app/[locale]/(main)/page.tsx`

Replace hardcoded section:

```typescript
import { fetchNewProductWidget } from "@/lib/api-server";
import type { NewProductSettings } from "@/types/api";

export default async function HomePage() {
  // ... existing code ...

  // Fetch new-product widget
  const { widget: newProductWidget, products: newProducts } = await fetchNewProductWidget();
  const newProductSettings = newProductWidget?.settings as NewProductSettings | null;
  const newProductColumns = newProductSettings?.columns ?? 5;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ... banner, collection sections ... */}

        {/* New Arrivals - Widget Driven */}
        {newProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {newProductWidget?.name ?? t("newArrivals")}
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

            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${newProductColumns}, minmax(0, 1fr))`,
              }}
            >
              {newProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`}>
                  <ProductItem
                    name={p.name}
                    price={`${p.sale_price.toLocaleString()}₫`}
                    originalPrice={p.discount_percent > 0 ? `${p.default_price.toLocaleString()}₫` : undefined}
                    discountPercent={p.discount_percent > 0 ? p.discount_percent : undefined}
                    image={p.avatar || ""}
                    isNew
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Fallback if no widget configured */}
        {newProducts.length === 0 && (
          <section className="mb-12">
            {/* Keep existing hardcoded section as fallback */}
          </section>
        )}

        {/* ... trend hot section ... */}
      </main>
    </>
  );
}
```

### 3. Add Responsive Grid Classes

For mobile responsiveness, use Tailwind classes instead of inline style:

```typescript
// Helper to get grid class
const getGridClass = (cols: number) => {
  const map: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  };
  return map[cols] ?? map[5];
};

// Usage
<div className={`grid gap-6 ${getGridClass(newProductColumns)}`}>
```

## Todo

- [x] Add `fetchProductsByTags()` to api-server.ts
- [x] Add `fetchNewProductWidget()` to api-server.ts
- [x] Update homepage to fetch new-product widget
- [x] Replace hardcoded ProductItem list with widget data
- [x] Add responsive grid based on columns setting
- [x] Keep fallback for when no widget configured
- [x] Test with different column configurations

## Verification

1. Create `new-product` widget in admin
2. Select tags and configure quantity/columns
3. Set status to "Hiển thị"
4. Visit homepage → verify products match widget config
5. Change tags in admin → verify homepage updates (after cache expires)
6. Delete widget → verify fallback renders

## Notes

- Server-side caching: 60s for products, 300s for tags
- Responsive grid: 2 cols mobile → up to 5 cols desktop
- Fallback: Keep hardcoded products if no widget configured
