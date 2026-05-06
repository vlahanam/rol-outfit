# Phase 01 — List Page: Avatar Fix + Extract Variants Sub-Table + Variant Avatar Column

## Context Links
- Plan overview: [plan.md](./plan.md)
- Target file: `frontend/app/admin/(protected)/products/page.tsx` (~295 lines, over 200-line limit)
- New file: `frontend/components/admin/product-list-variants-table.tsx`
- Reference: `frontend/components/admin/product-variants-table.tsx` (uses `VariantAvatarCell` pattern)

## Overview
- **Priority**: High
- **Status**: completed
- **Effort**: 1h
- **Completed**: 2026-05-07
- **Description**: Fix product avatar rendering on the admin product list page (add `unoptimized` to bypass Next.js optimizer that can't reach Nginx `/uploads/` from frontend container). Extract the inline variants sub-table into a dedicated component (page is currently ~295 lines, over the 200-line limit). Add a variant avatar column to the extracted sub-table.

## Key Insights
- Next.js `<Image>` optimizer runs in the frontend container; it cannot reach the Nginx-served `/uploads/` path. The `unoptimized` prop bypasses optimization and serves the raw URL.
- The variants sub-table is rendered inline inside the expanded row — extracting keeps `page.tsx` under 200 lines and creates a reusable component for the variants display.
- `VariantAvatarCell` should be a local helper inside `product-list-variants-table.tsx` (not imported from `product-variants-table.tsx`) to avoid cross-component coupling.

## Requirements
### Functional
- Product avatar in the main table renders correctly (no broken images)
- Expanded row shows a new "Ảnh" column for each variant, with avatar (40×40 rounded) or placeholder icon
- Sub-table behavior unchanged (SKU, attributes, price, stock, sold, status, edit, delete)

### Non-functional
- `page.tsx` reduced to under 200 lines after extraction
- New component `product-list-variants-table.tsx` under 200 lines
- All `<Image>` components serving `/uploads/` use `unoptimized`

## Architecture
```
products/page.tsx
  ├── ProductsTable (main table — product avatar with unoptimized)
  └── on row expand: <ProductListVariantsTable product={product} />
                       ├── header: SKU | Ảnh | <attribute_names...> | Giá | Tồn Kho | Đã Bán | Trạng Thái | Hành Động
                       └── rows: variant data + VariantAvatarCell + edit/delete buttons
```

### Data flow
- `page.tsx` already has `AdminProduct[]` from `api.adminProducts.list()`
- Each `AdminProduct` includes `variants: ProductVariant[]` and `attribute_names: string[]`
- `<ProductListVariantsTable>` receives the full `AdminProduct` — no extra fetching

## Related Code Files
### Modify
- `frontend/app/admin/(protected)/products/page.tsx` — add `unoptimized` to product avatar Image; replace inline variants markup with `<ProductListVariantsTable product={product} />`

### Create
- `frontend/components/admin/product-list-variants-table.tsx` — extracted variants sub-table component with new Ảnh column

### Read for context
- `frontend/components/admin/product-variants-table.tsx` — reference for `VariantAvatarCell` pattern
- `frontend/types/api.ts` — `AdminProduct`, `ProductVariant` types

## Implementation Steps

1. **Read current state**
   - Read `frontend/app/admin/(protected)/products/page.tsx` to identify exact line range of inline variants sub-table
   - Read `frontend/components/admin/product-variants-table.tsx` to understand `VariantAvatarCell` pattern
   - Read `frontend/types/api.ts` to confirm `AdminProduct` and `ProductVariant` shapes

2. **Create new component file** at `frontend/components/admin/product-list-variants-table.tsx`:
   - `"use client"` directive
   - Imports: `Image` from `next/image`, `ImageIcon`, `Pencil`, `Trash2` from `lucide-react`, `useRouter` from `next/navigation`, `AdminProduct`, `ProductVariant` from `@/types/api`, any UI primitives the original sub-table uses (Button, Badge, etc.)
   - Local helper `VariantAvatarCell({ avatar }: { avatar?: string })`:
     - 40×40 rounded container (`relative h-10 w-10 overflow-hidden rounded-md border bg-muted`)
     - If `avatar`: `<Image src={avatar} alt="" fill unoptimized className="object-cover" />`
     - Else: centered `<ImageIcon className="h-5 w-5 text-muted-foreground" />`
   - Component signature: `export function ProductListVariantsTable({ product }: { product: AdminProduct })`
   - Render the table headers in this order: `SKU | Ảnh | {product.attribute_names.map} | Giá | Tồn Kho | Đã Bán | Trạng Thái | Hành Động`
   - Render rows for `product.variants` — same structure as before, with `VariantAvatarCell` after SKU column
   - Edit button: `router.push(\`/admin/products/${product.id}/variants/${v.id}\`)`
   - Delete button: keep existing handler (move it from page.tsx into this component or pass via prop — prefer passing the delete handler as a prop to keep this component pure)
   - Recommendation: accept `onDelete?: (variantId: number) => void` prop so deletion logic stays in page.tsx (it has access to refresh state)

3. **Update `page.tsx`**:
   - Add `unoptimized` prop to the product avatar `<Image>` (lines ~218-225)
   - Remove the inline variants sub-table markup (the section rendering variants when row is expanded)
   - Replace with `<ProductListVariantsTable product={product} onDelete={handleDeleteVariant} />`
   - Remove now-unused imports (e.g., if `ImageIcon` was only used inline)
   - Verify final line count under 200

4. **Compile check**:
   - `cd frontend && pnpm build` (or `pnpm tsc --noEmit`) — must succeed with zero TS errors
   - Verify no unused imports

## Todo List
- [x] Read current `page.tsx` to locate the inline variants sub-table block
- [x] Read `product-variants-table.tsx` for `VariantAvatarCell` pattern reference
- [x] Create `frontend/components/admin/product-list-variants-table.tsx` with `VariantAvatarCell` helper
- [x] Implement `ProductListVariantsTable` component with full header set including Ảnh column
- [x] Add edit button (router.push to variant edit route) in action cell
- [x] Add delete button wired through `onDelete` prop
- [x] Add `unoptimized` to product avatar `<Image>` in `page.tsx`
- [x] Replace inline variants sub-table with `<ProductListVariantsTable />` in `page.tsx`
- [x] Remove unused imports from `page.tsx`
- [x] Verify `page.tsx` is under 200 lines
- [x] Verify `product-list-variants-table.tsx` is under 200 lines
- [x] Run TS compile check — zero errors

## Success Criteria
- Product avatars render visibly on the list page (no broken image icons)
- Expanded row shows variant avatars or placeholder icons in a new Ảnh column
- `page.tsx` is under 200 lines
- `product-list-variants-table.tsx` is under 200 lines
- TypeScript compile passes with zero errors
- Edit button on each variant row navigates to `/admin/products/{id}/variants/{variantId}` (target page created in Phase 3)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missed import/export when extracting | Medium | Low | Run TS compile after extraction |
| Avatar URL is null/undefined for old variants | High | Low | `VariantAvatarCell` handles missing `avatar` with placeholder |
| Visual regression in sub-table layout | Medium | Low | Match exact column order/styling from original inline markup |
| Page still exceeds 200 lines after extraction | Low | Medium | If still over, extract additional helpers (e.g., status badge) |

## Security Considerations
- No new auth surface — purely UI change
- `unoptimized` does not bypass auth; Nginx still serves `/uploads/` per its config

## Rollback
- Revert single commit affecting `page.tsx` + new component file
- No DB / API changes

## Next Steps
- Phase 2 adds the same edit button concept to `ProductVariantsTable` (the table on product edit page)
- Phase 3 creates the target route the edit button navigates to
