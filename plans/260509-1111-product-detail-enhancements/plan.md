---
title: "Product Detail Page Enhancements"
description: "Stock always visible, total amount display, description section below grid, footer sticky fix"
status: completed
priority: P1
effort: 1h
branch: develop
tags: [frontend, product-detail, ui]
created: 2026-05-09
---

# Plan: Product Detail Enhancements

## Overview

4 UI-only changes in a single file: `frontend/app/[locale]/(main)/product/[id]/page.tsx`

## Changes

| # | Change | Detail |
|---|--------|--------|
| 1 | **Stock always visible** | Default = sum of all variants' stock. When variant selected → that variant's stock |
| 2 | **Total amount** | Show `price × quantity` below quantity picker |
| 3 | **Description section** | Move `product.description` to full-width section below the product grid |
| 4 | **Footer fix** | Outer div: `flex flex-col`, content div: `flex-1 w-full` → footer sticks to bottom |

## Files

- **Modify**: `frontend/app/[locale]/(main)/product/[id]/page.tsx`

## Implementation

### 1 — Stock logic
```ts
const totalStock = useMemo(() => variants.reduce((s, v) => s + (v.stock ?? 0), 0), [variants]);
// display:
const stockDisplay = variant ? variant.stock : (hasVariants ? totalStock : null);
```

### 2 — Total amount
```tsx
<p className="text-lg font-semibold text-blue-700 mt-2">
  Thành tiền: {formatPrice(price * quantity)}
</p>
```
Place after quantity controls, before cart message.

### 3 — Description
- Remove from right column (between price and variant picker)
- Add below main grid:
```tsx
{product.description && (
  <div className="border-t border-gray-200 pt-8 mb-16">
    <h2 className="text-lg font-semibold mb-3">Mô tả sản phẩm</h2>
    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
  </div>
)}
```

### 4 — Footer fix
```tsx
<div className="min-h-screen bg-white flex flex-col">
  <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
    {/* content */}
  </div>
  <Footer />
</div>
```

## Todo

- [x] Plan created
- [x] Implement all 4 changes in product detail page
- [x] Verify build compiles
