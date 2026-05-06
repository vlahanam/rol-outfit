# Phase 02 — Add Edit Button to ProductVariantsTable

## Context Links
- Plan overview: [plan.md](./plan.md)
- Target file: `frontend/components/admin/product-variants-table.tsx`
- Used by: `frontend/app/admin/(protected)/products/[id]/page.tsx` (product edit page)
- Routes to: `/admin/products/[id]/variants/[variantId]` (created in Phase 3)

## Overview
- **Priority**: High
- **Status**: completed
- **Effort**: 0.5h
- **Completed**: 2026-05-07
- **Description**: Add a Pencil edit button next to the existing delete button in each variant row of `ProductVariantsTable`. Clicking the button navigates to the dedicated variant edit page.

## Key Insights
- Component already has `Ảnh` column with `VariantAvatarCell` and an `ImageUploader` for the add row — only the edit button is missing
- Delete button currently sits alone in the action cell — keep it; place edit button to its left
- Use `useRouter` from `next/navigation` for client-side navigation (component is already `"use client"`)
- The component must know the `productId` to construct the route — confirm it's already a prop (likely `product: AdminProduct` or `productId: number`); if not, add it

## Requirements
### Functional
- Each existing variant row shows two action buttons: edit (Pencil) and delete (Trash2)
- Edit button navigates to `/admin/products/{productId}/variants/{variantId}`
- Add row (new variant) does NOT show an edit button (it has a save action instead, which is existing behavior)

### Non-functional
- File stays under 200 lines (currently estimate ~250 — verify; if it exceeds, extract action cell into a helper)
- No behavioral change to existing add/delete flow

## Architecture
```
ProductVariantsTable
  ├── header row
  ├── existing variant rows
  │     └── action cell: [Pencil edit] [Trash2 delete]   ← NEW: edit button
  └── add row
        └── action cell: [Save] (unchanged)
```

### Data flow
- Edit button click → `router.push('/admin/products/${productId}/variants/${v.id}')`
- No state mutation; pure navigation

## Related Code Files
### Modify
- `frontend/components/admin/product-variants-table.tsx`

### Read for context
- `frontend/app/admin/(protected)/products/[id]/page.tsx` — confirm what props are passed to `ProductVariantsTable`
- `frontend/types/api.ts` — `ProductVariant`, `AdminProduct`

## Implementation Steps

1. **Read current state**
   - Read `frontend/components/admin/product-variants-table.tsx` to:
     - Confirm component prop shape (looking for `productId` or `product`)
     - Locate the action cell of existing variant rows (where the delete button is)
     - Count current line length
   - Read `frontend/app/admin/(protected)/products/[id]/page.tsx` to see how props are passed in

2. **Add imports**
   - `import { Pencil, Trash2 } from "lucide-react"` (Trash2 likely already imported)
   - `import { useRouter } from "next/navigation"` (if not already imported)

3. **Initialize router**
   - Inside the component body: `const router = useRouter()`

4. **Add edit button**
   - In the existing variant row's action cell, before the delete button:
     ```tsx
     <Button
       type="button"
       variant="ghost"
       size="icon"
       onClick={() => router.push(`/admin/products/${productId}/variants/${v.id}`)}
       aria-label="Chỉnh sửa biến thể"
     >
       <Pencil className="h-4 w-4" />
     </Button>
     ```
   - If component currently receives `product: AdminProduct` (not `productId`), use `product.id`
   - If component does NOT have access to product id, add a prop: `productId: number` and pass from parent

5. **Verify file size**
   - If file exceeds 200 lines after the addition, extract the action-cell JSX into a small inline helper (`renderRowActions(v)`) or split into a sub-component file. Default expectation: ~5-line addition is acceptable; only refactor if file is well over 200.

6. **Compile check**
   - `cd frontend && pnpm tsc --noEmit` — must succeed
   - Verify no unused imports

## Todo List
- [x] Read `product-variants-table.tsx` and confirm prop shape (productId vs product)
- [x] Read parent page to see how props are passed
- [x] Add `Pencil` import from `lucide-react`
- [x] Add `useRouter` import from `next/navigation` (if missing)
- [x] Initialize `const router = useRouter()` inside component
- [x] Insert edit button before delete button in existing variant row action cell
- [x] Wire onClick to `router.push(\`/admin/products/${productId}/variants/${v.id}\`)`
- [x] Add `aria-label="Chỉnh sửa biến thể"` for accessibility
- [x] Verify file is under 200 lines (extract action cell helper if needed)
- [x] Run TS compile check — zero errors

## Success Criteria
- Edit button (Pencil icon) appears in each existing variant row's action cell, to the left of the delete button
- Click navigates to `/admin/products/{productId}/variants/{variantId}`
- Add row (new variant) action cell unchanged
- File compiles, zero TS errors
- File stays under 200 lines

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Component does not have access to `productId` | Medium | Low | Add `productId` prop and pass from parent |
| File exceeds 200 lines after addition | Low | Medium | Extract action-cell helper if needed |
| Edit button visually clashes with delete | Low | Low | Use same `variant="ghost" size="icon"` pattern |
| Navigation target does not exist yet (Phase 3) | High | Medium | Phase 3 creates the target page; if Phase 2 ships first, navigation will 404 — accept this since both phases ship together |

## Security Considerations
- Route is admin-protected by `(protected)` route group — no new auth surface
- No data exposure; navigation only

## Rollback
- Revert single commit on this file
- No DB / API changes

## Next Steps
- Phase 3 creates the target page `/admin/products/[id]/variants/[variantId]`
