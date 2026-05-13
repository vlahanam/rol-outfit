---
phase: 02
title: "Frontend – new-arrivals real data"
status: pending
priority: P1
effort: 1h
blockedBy: [phase-01-backend-tag-filter]
---

# Phase 02 – Frontend: New Arrivals Real Data

## Context Links
- Page: `frontend/app/[locale]/(main)/new-arrivals/page.tsx`
- Reference (shop page pattern): `frontend/app/[locale]/(main)/shop/page.tsx`
- API client: `frontend/lib/api.ts`
- Types: `frontend/types/api.ts` — `Product`, `ApiResponse`

## Overview
Replace the hardcoded static `newProducts` array in `new-arrivals/page.tsx` with a real API fetch using `GET /api/v1/products?tag=new`. Follow the exact same pattern as `shop/page.tsx`.

## Requirements
- Fetch products from `/products?tag=new&limit=50` on mount
- Show loading state while fetching
- Show "no products" message when empty
- Click navigates to `/product/{id}` (real ID, not hardcoded `/product/1`)
- Sort (newest / price-low / price-high) works on fetched data
- `isNew` badge on `ProductItem` stays

## Implementation Steps

### 1. Replace static data with API fetch

Remove the hardcoded `newProducts` array and `useState` for it. Add proper state + effect:

```tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductItem } from "@/components/ProductItem";
import { Footer } from "@/components/Footer";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { ApiResponse, Product } from "@/types/api";

function formatPrice(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

function effectivePrice(p: Product): number {
  return p.sale_price ?? p.default_price;
}

export default function NewArrivalsPage() {
  const t = useTranslations("NewArrivalsPage");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Product[]>>("/products?tag=new&limit=50")
      .then((res) => setProducts(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-low") return effectivePrice(a) - effectivePrice(b);
    if (sortBy === "price-high") return effectivePrice(b) - effectivePrice(a);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="mb-8">
          <div className="inline-block bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full mb-3">
            {t("badge")}
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600">
            {t("showing")} <span className="font-semibold">{sorted.length}</span> {t("newProducts")}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-low">{t("sortPriceLow")}</option>
            <option value="price-high">{t("sortPriceHigh")}</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{tCommon("loading")}</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sorted.map((product) => (
              <div key={product.id} onClick={() => router.push(`/product/${product.id}`)} className="cursor-pointer">
                <ProductItem
                  name={product.name}
                  price={formatPrice(effectivePrice(product))}
                  originalPrice={
                    product.sale_price < product.default_price
                      ? formatPrice(product.default_price)
                      : undefined
                  }
                  discountPercent={
                    product.discount_percent > 0 && product.sale_price < product.default_price
                      ? Math.round((1 - product.sale_price / product.default_price) * 100)
                      : undefined
                  }
                  image={
                    product.avatar ||
                    "https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                  }
                  isNew
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
```

### 2. Check `t("noProducts")` key exists

Verify the translation key `NewArrivalsPage.noProducts` exists in all locale files. If missing, add it (same text as `ShopPage.noProducts`).

Locale files to check:
- `frontend/messages/*.json`

## Todo
- [ ] Replace static `newProducts` with `useState<Product[]>` + `useEffect` API fetch
- [ ] Use `api.get<ApiResponse<Product[]>>("/products?tag=new&limit=50")`
- [ ] Implement sort on fetched data (mirrors shop page pattern)
- [ ] Fix navigation: `router.push(\`/product/\${product.id}\`)` (was hardcoded `/product/1`)
- [ ] Add loading + empty states
- [ ] Check/add `NewArrivalsPage.noProducts` translation key

## Success Criteria
- `/new-arrivals` shows real products tagged "NEW" from the database
- Clicking a product navigates to the correct `/product/{id}` route
- Sort controls work on real data
- Loading spinner appears while fetching
- Empty state shown when no "NEW" tagged products exist
