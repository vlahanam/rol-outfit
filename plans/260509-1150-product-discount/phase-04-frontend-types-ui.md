# Phase 04 — Frontend Types + ProductItem Component

**Status:** done | **Effort:** 45m | **Independent** (can run parallel with 01–03)

## Files to Modify

| File | Change |
|------|--------|
| `frontend/types/api.ts` | Add discount fields + `sale_price` to Product, ProductVariant |
| `frontend/components/ProductItem.tsx` | Show sale price, badge, strikethrough original |
| `frontend/lib/api-resources.ts` | Check UpdateVariantPayload needs discount fields |

---

## types/api.ts

### Product

```ts
export interface Product {
  // ... existing fields ...
  discount_percent: number;         // 0 = no discount
  discount_start_at: string | null; // RFC3339 or ""
  discount_end_at: string | null;
  sale_price: number;               // server-computed effective price
}
```

### ProductVariant

```ts
export interface ProductVariant {
  // ... existing fields ...
  discount_percent: number;
  discount_start_at: string | null;
  discount_end_at: string | null;
  sale_price: number;               // variant effective price (with fallback to product discount)
}
```

### UpdateProductPayload

```ts
export interface UpdateProductPayload {
  // ... existing ...
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}
```

### UpdateVariantPayload

```ts
export interface UpdateVariantPayload {
  // ... existing ...
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}
```

### CreateProductPayload

```ts
export interface CreateProductPayload {
  // ... existing ...
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}
```

### CreateVariantPayload

```ts
export interface CreateVariantPayload {
  // ... existing ...
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}
```

---

## components/ProductItem.tsx

Update interface and render:

```tsx
interface ProductItemProps {
  name: string;
  price: string;           // effective/sale price (formatted)
  originalPrice?: string;  // original price (shown crossed out when discounted)
  discountPercent?: number; // badge value
  image: string;
  isNew?: boolean;
}

export function ProductItem({ name, price, originalPrice, discountPercent, image, isNew }: ProductItemProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {isNew && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">NEW</span>
        )}
        {discountPercent && discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}
      </div>
      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{name}</h4>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-gray-900 font-semibold">{price}</p>
        {originalPrice && (
          <p className="text-sm text-gray-400 line-through">{originalPrice}</p>
        )}
      </div>
    </div>
  );
}
```

---

## Helper — formatPrice (shared)

The shop page already has `formatPrice`. No new helper needed — callers format before passing to `ProductItem`.

## lib/api-resources.ts

Check if `UpdateVariantPayload` is used here for the variant update API call. If so, the interface update in `types/api.ts` is sufficient — no changes to the call site needed.

## Todo

- [x] Add discount fields to `Product`, `ProductVariant` in `types/api.ts`
- [x] Add discount fields to all payload interfaces
- [x] Update `ProductItem.tsx` to show sale badge + strikethrough
- [x] Verify `lib/api-resources.ts` uses types (no duplicate interface definitions)
- [x] `npx tsc --noEmit` — no new errors
