# Phase 2: Related Products Section

## Context Links
- Product detail page: `/frontend/app/[locale]/(main)/product/[id]/page.tsx`
- Products API: `GET /api/v1/products?category_id=X` (exists in `route.go` line 61)
- Product type: `/frontend/types/api.ts` (Product interface)
- API resources: `/frontend/lib/api-resources.ts`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1 hour

Add "Related Products" section showing other products from same category, excluding current product.

## Key Insights
- Backend endpoint exists: `GET /api/v1/products?category_id=X&limit=Y`
- Product has `category_id` field
- Can reuse existing product card component pattern
- Exclude current product client-side (simple filter)

## Requirements

### Functional
- Display 4-8 products from same category
- Exclude current product from list
- Show product card with image, name, price
- Link to product detail page

### Non-Functional
- Lazy load section (below fold)
- Handle empty state gracefully

## Architecture

**Data Flow:**
```
Current product.category_id
  -> GET /api/v1/products?category_id=X&limit=9
  -> Filter out current product ID
  -> Display max 8 products
```

**Component Structure:**
```
ProductDetailPage
  └── RelatedProductsSection (new)
        └── ProductCard (reuse or create simple version)
```

## Related Code Files

### Files to Create
- `frontend/components/product/related-products-section.tsx`

### Files to Modify
- `frontend/app/[locale]/(main)/product/[id]/page.tsx`
- `frontend/lib/api-resources.ts` (add listByCategory if needed)

### Files to Read (Context)
- Existing product grid/card patterns in `/frontend/components/`

## Implementation Steps

1. **Add API function** in `api-resources.ts`:
   ```typescript
   export const products = {
     // ... existing
     listByCategory(categoryId: string, limit = 9): Promise<ApiResponse<Product[]>> {
       return request<ApiResponse<Product[]>>(
         `/products?category_id=${categoryId}&limit=${limit}`
       );
     },
   };
   ```

2. **Create RelatedProductsSection component**:
   ```typescript
   // frontend/components/product/related-products-section.tsx
   interface Props {
     categoryId: string;
     excludeProductId: string;
   }
   
   export function RelatedProductsSection({ categoryId, excludeProductId }: Props) {
     const [products, setProducts] = useState<Product[]>([]);
     const locale = useLocale();
     const t = useTranslations("ProductDetailPage");
     
     useEffect(() => {
       products.listByCategory(categoryId, 9)
         .then(res => {
           const filtered = res.data
             .filter(p => p.id !== excludeProductId)
             .slice(0, 8);
           setProducts(filtered);
         })
         .catch(() => {});
     }, [categoryId, excludeProductId]);
     
     if (products.length === 0) return null;
     
     return (
       <section className="border-t border-gray-200 pt-8 mt-8">
         <h2 className="text-lg font-semibold mb-4">{t("relatedProducts")}</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {products.map(p => (
             <ProductCard key={p.id} product={p} />
           ))}
         </div>
       </section>
     );
   }
   ```

3. **Create simple ProductCard** (or reuse existing):
   ```typescript
   // frontend/components/product/product-card.tsx
   export function ProductCard({ product }: { product: Product }) {
     return (
       <Link href={`/product/${product.id}`} className="group">
         <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
           {product.avatar && (
             <Image src={product.avatar} alt={product.name} fill className="object-cover" />
           )}
         </div>
         <h3 className="mt-2 text-sm font-medium truncate">{product.name}</h3>
         <p className="text-sm text-blue-600 font-semibold">
           {formatPrice(product.sale_price, product.product_type)}
         </p>
       </Link>
     );
   }
   ```

4. **Add to product detail page** (after description section):
   ```typescript
   <RelatedProductsSection 
     categoryId={product.category_id} 
     excludeProductId={product.id} 
   />
   ```

5. **Add translation keys**:
   - `"relatedProducts": "San pham lien quan"` (vi)
   - `"relatedProducts": "関連商品"` (ja)

## Todo List
- [ ] Add `listByCategory` API function
- [ ] Create `ProductCard` component
- [ ] Create `RelatedProductsSection` component
- [ ] Import and render in product detail page
- [ ] Add translation keys
- [ ] Test with products in same category

## Success Criteria
- [ ] Related products section appears below description
- [ ] Shows up to 8 products from same category
- [ ] Current product is excluded
- [ ] Empty state handled (section hidden)
- [ ] Links work correctly

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Category has only 1 product | Low | Low | Hide section when empty |
| Slow API response | Low | Medium | Show loading skeleton |

## Security Considerations
- None — public product data only
