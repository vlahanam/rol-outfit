# Phase 06 — Frontend User Pages

**Status:** done | **Effort:** 45m | **Depends on:** Phase 04

## Files to Modify

| File | Change |
|------|--------|
| `frontend/app/[locale]/(main)/product/[id]/page.tsx` | Show sale_price with strikethrough original |
| `frontend/app/[locale]/(main)/shop/page.tsx` | Pass sale price + discount badge to ProductItem; sort by effective price |

---

## product/[id]/page.tsx

### Current price display (line ~128)

```tsx
<span className="text-3xl font-bold text-blue-600">{formatPrice(price)}</span>
```

### New price display

The `price` variable is currently `variant?.price ?? product?.default_price ?? 0`.
Add `salePrice` derived from `variant?.sale_price ?? product?.sale_price ?? price`:

```tsx
// After existing price/stock derivation:
const salePrice = variant?.sale_price ?? product?.sale_price ?? price;
const isDiscounted = salePrice < price;
```

Render:
```tsx
<div className="mb-4">
  <div className="flex items-center gap-3 flex-wrap">
    <span className="text-3xl font-bold text-blue-600">{formatPrice(salePrice)}</span>
    {isDiscounted && (
      <>
        <span className="text-xl text-gray-400 line-through">{formatPrice(price)}</span>
        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
          -{Math.round((1 - salePrice / price) * 100)}%
        </span>
      </>
    )}
  </div>
  {hasVariants && (
    <p className={`text-sm mt-1 ${!stockEmpty ? 'text-gray-500' : 'text-red-500'}`}>
      {stockText}
    </p>
  )}
</div>
```

### Total amount — use salePrice

```tsx
<p className="text-sm font-semibold text-blue-700 mt-2">
  Thành tiền: {formatPrice(salePrice * quantity)}
</p>
```

---

## shop/page.tsx

### Helper — effective price for sort

```ts
function effectivePrice(p: Product): number {
  return p.sale_price ?? p.default_price;
}
```

### Sort update

```ts
const filtered = products
  .filter(...)
  .sort((a, b) => {
    if (sortBy === "price-low") return effectivePrice(a) - effectivePrice(b);
    if (sortBy === "price-high") return effectivePrice(b) - effectivePrice(a);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
```

### ProductItem call — pass sale price data

```tsx
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
  image={product.avatar || "https://images.unsplash.com/..."}
/>
```

---

## Notes

- `sale_price` is server-computed — frontend only reads it, never calculates from `discount_percent` directly (single source of truth in backend)
- If `sale_price === default_price`, no discount is active (time window not open) → show no badge
- `Math.round(...)` for badge % may differ slightly from `discount_percent` due to rounding — use `product.discount_percent` directly for the badge if cleaner

## Todo

- [x] Update `product/[id]/page.tsx`: derive `salePrice`, update price display, update total amount
- [x] Update `shop/page.tsx`: `effectivePrice` helper, sort logic, `ProductItem` props
- [x] Verify discount badge shows correctly when active, hidden when inactive
- [x] `npx tsc --noEmit` — no new errors
