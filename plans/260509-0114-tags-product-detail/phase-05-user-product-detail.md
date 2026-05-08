# Phase 05 — User Product Detail: Variant Picker + Tag Badges + Multi-Image Gallery

## Context Links
- Depends on: Phase 02 (public product GET returns `tags`)
- Existing page: `frontend/app/[locale]/(main)/product/[id]/page.tsx` (185 lines, will be slimmed)
- Existing variants endpoint: `GET /products/:productID/variants` (already public)
- Variant model includes `attributes: Record<string,string>`, `price`, `stock`, `avatar`
- Cart endpoint: `POST /cart/items { product_id, attr_id?, quantity }` — `attr_id` is the variant ID

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 4h
- **Description:** Replace the basic product detail page with: (1) multi-image gallery built from product avatar + each variant avatar, (2) attribute-based variant picker (e.g. Color → Size) that resolves to a single variant + price + stock, (3) active tag badges near the product name. Cart submission carries the resolved variant ID.

## Key Insights

### Attribute axes derivation
The backend stores `product.attribute_names: string[]` (e.g. `["Màu sắc", "Size"]`) — these are the AXES. Each variant has `attributes: { "Màu sắc": "Đỏ", "Size": "M" }`. To build the picker:
1. For each axis name, collect distinct values across variants → axis value list
2. Render one picker (button group) per axis
3. As user picks values, narrow the candidate set; if a single variant matches, "select" it
4. Disable values that have NO matching in-stock variant given the current partial selection

### Variant resolution function
```ts
function resolveVariant(variants, selection): Variant | null {
  return variants.find(v =>
    Object.keys(selection).every(k => selection[k] && v.attributes[k] === selection[k])
  ) ?? null;
}
```
Active variant exists only when ALL axes are picked AND a matching variant is found.

### Pricing fallback
- No selection yet → show `product.default_price`
- Variant resolved → show `variant.price`
- Variant resolved + `stock <= 0` → show price but disable Add to Cart, label "Hết hàng"

### Cart payload
- If product has variants AND a variant is resolved: send `attr_id: variant.id`
- If product has NO variants (variants array empty): send only `product_id` (current behaviour)
- If product has variants but none picked: disable Add to Cart, prompt user to pick

### Image gallery sources
Combine in this order, dedupe by URL:
1. `product.avatar` (if present)
2. Each `variant.avatar` (if present)

Selected variant's avatar should auto-jump the main image to that variant's image (UX delight).

### Tag badges
Render `product.tags` as inline badges below product name:
```
[Mới] [Sale -20%] [Hot]
```
Each is a span with a colored background. Backend filters to active tags only — UI just renders.

## Requirements

### Functional
- Variant picker: one row of selectable buttons per `attribute_names` entry
- Disable axis values that have no compatible in-stock variant given current partial selection
- Price updates live as variant resolves
- Stock count shown beneath price when variant resolved (`Còn 12 sản phẩm`)
- Add to Cart disabled when variants exist but none selected, OR selected variant out of stock
- Image gallery: thumbnail strip (horizontally scrollable on mobile)
- Tag badges visible if product has tags

### Non-Functional
- Page file ≤ 200 lines (currently 185, will be split)
- Three new components, each under `frontend/components/product/`, each ≤ 200 lines
- No layout shift on variant change

## Architecture

### New components

#### `frontend/components/product/variant-picker.tsx`
```tsx
interface Props {
  attributeNames: string[];
  variants: ProductVariant[];
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}
```
- Renders one section per axis name
- For each axis, list distinct values from variants
- Compute `enabledValues(axis)`: values that have at least one variant matching current selection (excluding axis itself) AND `stock > 0`
- Disabled buttons are visually muted

#### `frontend/components/product/tag-badges.tsx`
```tsx
interface Props { tags: Tag[]; }
```
Pure presentational. Returns null if `tags.length === 0`. Color rotation by index for visual variety (KISS — no per-tag color in DB).

#### `frontend/components/product/image-gallery.tsx`
```tsx
interface Props { images: string[]; activeIndex: number; onSelect: (i: number) => void; }
```
- Main image (square, object-cover)
- Thumbnail strip with active-state ring
- Fallback to `FALLBACK_IMAGE` if `images` is empty

### Type updates (`types/api.ts`)

```ts
export interface Product {
  // ...existing fields
  tags?: Tag[]; // present on detail endpoint, may be absent on list endpoint
}
```
Tag type already exists (Phase 03).

### Page rewrite (`app/[locale]/(main)/product/[id]/page.tsx`)

Slimmed to orchestration:
```tsx
const [product, setProduct] = useState<Product | null>(null);
const [variants, setVariants] = useState<ProductVariant[]>([]);
const [selected, setSelected] = useState<Record<string, string>>({});
const [imageIdx, setImageIdx] = useState(0);
const [quantity, setQuantity] = useState(1);

// fetch product + variants in parallel on mount
useEffect(() => {
  Promise.all([
    api.get<ApiResponse<Product>>(`/products/${id}`),
    api.get<ApiResponse<ProductVariant[]>>(`/products/${id}/variants`),
  ]).then(([p, v]) => { setProduct(p.data); setVariants(v.data ?? []); })...
}, [id]);

const variant = resolveVariant(variants, selected);
const hasVariants = variants.length > 0;
const fullySelected = product && Object.keys(selected).length === (product.attribute_names?.length ?? 0);

const price = variant?.price ?? product?.default_price ?? 0;
const stock = variant?.stock ?? null;

const images = useMemo(() => buildImageList(product, variants), [product, variants]);

const handleAddToCart = async () => {
  if (!isLoggedIn()) { router.push('/login'); return; }
  if (hasVariants && !variant) { setCartMsg('Vui lòng chọn phân loại'); return; }
  if (variant && variant.stock <= 0) return;
  await api.post('/cart/items', {
    product_id: product.id,
    attr_id: variant?.id, // omitted naturally when undefined
    quantity,
  });
};

// auto-switch gallery image when variant changes and has avatar
useEffect(() => {
  if (variant?.avatar) {
    const idx = images.indexOf(variant.avatar);
    if (idx >= 0) setImageIdx(idx);
  }
}, [variant, images]);
```

Helper `buildImageList(product, variants)`:
```ts
function buildImageList(p, vs): string[] {
  const out = new Set<string>();
  if (p?.avatar) out.add(p.avatar);
  for (const v of vs) if (v.avatar) out.add(v.avatar);
  return [...out];
}
```

## Related Code Files

### Create
- `frontend/components/product/variant-picker.tsx`
- `frontend/components/product/tag-badges.tsx`
- `frontend/components/product/image-gallery.tsx`

### Modify
- `frontend/app/[locale]/(main)/product/[id]/page.tsx` (rewrite using new components)
- `frontend/types/api.ts` (add optional `tags?: Tag[]` to `Product`)

## Implementation Steps

1. Add optional `tags?: Tag[]` to `Product` interface in `types/api.ts`
2. Implement `tag-badges.tsx` (simplest — pure presentational)
3. Implement `image-gallery.tsx` (main + thumbnails + fallback)
4. Implement `variant-picker.tsx` with the disabled-state logic
5. Rewrite `product/[id]/page.tsx`:
   - Parallel fetch product + variants
   - Use `resolveVariant` helper
   - Wire image gallery, tag badges, variant picker
   - Update cart submission to include `attr_id`
6. `tsc --noEmit` clean
7. Manual smoke matrix:
   - Product with no variants → no picker, default price, add to cart works
   - Product with 2 axes, all in-stock → pick both → price/stock update → add to cart sends attr_id
   - Product with one axis sold out → that value's button disabled
   - Product with no tags → no badges
   - Product with 2 tags → 2 badges visible
   - Variant has avatar → selecting it shifts main image

## Todo List

- [ ] `Product.tags?: Tag[]` added (optional)
- [ ] `tag-badges.tsx` component
- [ ] `image-gallery.tsx` component (main + strip + fallback)
- [ ] `variant-picker.tsx` with axis derivation + disabled logic
- [ ] `resolveVariant` helper (inline in page or `lib/product-helpers.ts`)
- [ ] Page rewrite using all new components
- [ ] Cart payload includes `attr_id` when variant resolved
- [ ] Page file ≤ 200 lines
- [ ] No TS errors
- [ ] Manual smoke matrix complete

## Success Criteria
- Selecting Color + Size resolves a single variant; price displayed reflects that variant
- Disabled axis values match the actual in-stock matrix
- Cart line items now carry `attr_id` (verify in DB or admin cart view)
- Active tags display as badges; expired tags are filtered server-side and don't appear
- Image gallery deduplicates URLs; selecting a variant with `avatar` jumps the gallery to its image
- All new files ≤ 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Variant matrix has gaps (Red+L exists, Red+M doesn't) | Disabled-state algorithm prevents user from picking impossible combos |
| Empty variants list (legacy product) | UI gracefully degrades to default_price + no picker; cart payload omits `attr_id` |
| `attribute_names` empty but variants present | Edge case — fall back to: pick from first variant only (or render no picker, treat as "no choice") — document in code comment |
| Variant `attributes` keys differ from `attribute_names` | Use `attribute_names` as the source of truth for axis order; ignore unknown keys |
| Image dedupe loses ordering | Use `Set` initialized in insertion order — preserves `[product.avatar, ...variant avatars]` order |
| Locale routing — page lives under `[locale]` | No change needed; `useParams` extracts `id` only |
| Tags shape mismatch (Phase 02 sends `start_at: null`) | Tag badges component reads only `id`, `name` — null timestamps irrelevant |

## Security Considerations
- Public endpoint — no auth required for fetching
- Cart submit still requires JWT (existing behavior)
- No XSS surface: tag names rendered as text (React escapes by default)

## Next Steps
- Future enhancement (out of scope): tag-based filtering on shop list page
- Future enhancement (out of scope): per-variant image arrays (current impl uses single avatar per variant)
- Future enhancement (out of scope): "Related products by tag" carousel
