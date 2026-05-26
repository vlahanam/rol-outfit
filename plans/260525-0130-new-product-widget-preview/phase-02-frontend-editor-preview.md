# Phase 2: Frontend Editor & Preview

**Status:** complete  
**Priority:** high  
**Estimated:** 3 hours  
**Depends on:** Phase 1

## Overview

Create editor and preview components for `new-product` widget type, following `trend-hot` pattern.

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/components/admin/widgets/new-product-editor.tsx` | Tag selection, quantity, columns settings |
| `frontend/components/admin/widgets/new-product-preview.tsx` | Real-time product grid preview |

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/types/api.ts` | Add `NewProductMetadata`, `NewProductSettings` |
| `frontend/lib/api-resources.ts` | Add `products.listByTags()` method |
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | Add new-product editor/preview |

## Implementation Steps

### 1. Add TypeScript Types

**File:** `frontend/types/api.ts`

```typescript
// Add after existing widget types
export interface NewProductMetadata {
  tag_ids: string[];
}

export interface NewProductSettings {
  quantity: number;  // 5-20, default 10
  columns: number;   // 2-5, default 5
}
```

### 2. Add Products API Method

**File:** `frontend/lib/api-resources.ts`

```typescript
export const products = {
  listByTags(params: {
    tags?: string[];
    limit?: number;
  }): Promise<ApiResponse<Product[]>> {
    const qs = new URLSearchParams();
    if (params.tags?.length) qs.set("tags", params.tags.join(","));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<ApiResponse<Product[]>>(`/products${query ? `?${query}` : ""}`);
  },
};
```

### 3. Create New Product Editor

**File:** `frontend/components/admin/widgets/new-product-editor.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Tag } from "@/types/api";

interface Props {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function NewProductEditor({ selectedTagIds, onChange }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminTags.listAll()
      .then((res) => setTags(res.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Đang tải tags...</div>;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        Chọn Tags (sản phẩm có bất kỳ tag nào sẽ xuất hiện)
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedTagIds.includes(tag.id)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      {tags.length === 0 && (
        <p className="text-sm text-gray-500">Chưa có tag nào. Tạo tag trong mục Quản lý Tags.</p>
      )}
    </div>
  );
}
```

### 4. Create New Product Preview

**File:** `frontend/components/admin/widgets/new-product-preview.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { ProductItem } from "@/components/ProductItem";
import type { Product, Tag } from "@/types/api";

type DeviceMode = "desktop" | "mobile";

interface Props {
  tagIds: string[];
  quantity: number;
  columns: number;
}

export function NewProductPreview({ tagIds, quantity, columns }: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tags to get slugs
  useEffect(() => {
    api.adminTags.listAll().then((res) => setTags(res.data));
  }, []);

  // Fetch products when tags change
  useEffect(() => {
    if (tagIds.length === 0 || tags.length === 0) {
      setProducts([]);
      return;
    }

    const slugs = tagIds
      .map((id) => tags.find((t) => t.id === id)?.slug)
      .filter(Boolean) as string[];

    if (slugs.length === 0) return;

    setLoading(true);
    api.products
      .listByTags({ tags: slugs, limit: quantity })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tagIds, quantity, tags]);

  const isMobile = deviceMode === "mobile";
  const gridCols = isMobile ? 2 : columns;

  if (tagIds.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
        Chọn ít nhất 1 tag để xem preview
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Preview ({products.length} sản phẩm)
        </p>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded transition-colors ${
              !isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded transition-colors ${
              isMobile ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Đang tải sản phẩm...</div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
          Không có sản phẩm nào với tags đã chọn
        </div>
      ) : (
        <div
          className="grid gap-4 p-4 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {products.slice(0, quantity).map((p) => (
            <ProductItem
              key={p.id}
              name={p.name}
              price={`${p.sale_price.toLocaleString()}₫`}
              originalPrice={p.discount_percent > 0 ? `${p.default_price.toLocaleString()}₫` : undefined}
              discountPercent={p.discount_percent > 0 ? p.discount_percent : undefined}
              image={p.avatar || ""}
              isNew
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Update Widget Edit Page

**File:** `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`

Add imports:
```typescript
import { NewProductEditor } from "@/components/admin/widgets/new-product-editor";
import { NewProductPreview } from "@/components/admin/widgets/new-product-preview";
import type { NewProductMetadata, NewProductSettings } from "@/types/api";
```

Add state:
```typescript
const [newProductTagIds, setNewProductTagIds] = useState<string[]>([]);
const [newProductQuantity, setNewProductQuantity] = useState(10);
const [newProductColumns, setNewProductColumns] = useState(5);
```

Add useEffect load:
```typescript
if (w.type === "new-product") {
  const meta = w.metadata as NewProductMetadata | null;
  if (meta?.tag_ids) setNewProductTagIds(meta.tag_ids);
  const settings = w.settings as NewProductSettings | null;
  if (settings?.quantity) setNewProductQuantity(settings.quantity);
  if (settings?.columns) setNewProductColumns(settings.columns);
}
```

Add submit handler:
```typescript
if (form.type === "new-product") {
  payload.metadata = { tag_ids: newProductTagIds };
  payload.settings = { quantity: newProductQuantity, columns: newProductColumns };
}
```

Add JSX section (after trend-hot):
```typescript
{form.type === "new-product" && (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Cài Đặt Hiển Thị</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Số sản phẩm: {newProductQuantity}
          </label>
          <Slider
            value={[newProductQuantity]}
            onValueChange={(vals) => vals[0] && setNewProductQuantity(vals[0])}
            min={5}
            max={20}
            step={1}
            className="w-full max-w-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Số cột: {newProductColumns}
          </label>
          <Slider
            value={[newProductColumns]}
            onValueChange={(vals) => vals[0] && setNewProductColumns(vals[0])}
            min={2}
            max={5}
            step={1}
            className="w-full max-w-xs"
          />
        </div>
      </div>
    </div>

    <NewProductPreview
      tagIds={newProductTagIds}
      quantity={newProductQuantity}
      columns={newProductColumns}
    />

    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700">Chọn Tags</h2>
      <NewProductEditor
        selectedTagIds={newProductTagIds}
        onChange={setNewProductTagIds}
      />
    </div>
  </div>
)}
```

## Todo

- [x] Add `NewProductMetadata`, `NewProductSettings` to types/api.ts
- [x] Add `products.listByTags()` to api-resources.ts
- [x] Create `new-product-editor.tsx`
- [x] Create `new-product-preview.tsx`
- [x] Update widget edit page with imports
- [x] Add state variables for new-product
- [x] Add useEffect load for new-product
- [x] Add submit handler for new-product
- [x] Add JSX section for new-product
- [x] Export products from api.ts

## Verification

1. Navigate to `/admin/widgets`
2. Create widget with type `new-product`
3. Edit widget → verify editor shows tag selector
4. Select tags → verify preview shows products
5. Adjust quantity/columns → verify preview updates
6. Save → verify metadata/settings persisted
