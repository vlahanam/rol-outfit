---
title: "Phase 3: Frontend – Types & API Layer"
status: completed
priority: high
completed: 2026-05-07
---

# Phase 3: Frontend – Types & API Layer

## Overview

Add payload types and extend `lib/api.ts` with all admin product operations needed by the add and edit pages.

## Related Files

- `frontend/types/api.ts` — add payload types
- `frontend/lib/api.ts` — add `adminProducts` methods
- `frontend/lib/validations.ts` — update `variantSchema` (make dynamic), fix `addProductSchema`

## Implementation Steps

### Step 1 – `types/api.ts`: Add payload types

Append to the file:

```ts
export interface CreateProductPayload {
  category_id: string;
  name: string;
  default_price: number;
  description?: string;
  avatar?: string;
  attribute_names: string[];
}

export interface UpdateProductPayload {
  category_id?: string;
  name?: string;
  default_price?: number;
  description?: string;
  avatar?: string;
  status?: number;
  attribute_names?: string[];
}

export interface CreateVariantPayload {
  attributes: Record<string, string>;
  price: number;
  stock: number;
  avatar?: string;
}

export interface UpdateVariantPayload {
  attributes?: Record<string, string>;
  price?: number;
  stock?: number;
  avatar?: string;
  status?: number;
}
```

### Step 2 – `lib/api.ts`: Extend `adminProducts`

Add the missing import at the top of the file:

```ts
import type {
  ApiErrorBody,
  ApiResponse,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  AdminProduct,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
  ProductVariant,
} from "@/types/api";
```

Replace (or extend) the `adminProducts` object:

```ts
adminProducts: {
  list(params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    search?: string;
  }): Promise<ApiResponse<AdminProduct[]>> {
    const p = params ?? {};
    const qs = new URLSearchParams();
    if (p.page) qs.set("page", String(p.page));
    if (p.limit) qs.set("limit", String(p.limit));
    if (p.category_id) qs.set("category_id", p.category_id);
    if (p.search) qs.set("search", p.search);
    const query = qs.toString();
    return request<ApiResponse<AdminProduct[]>>(
      `/admin/products${query ? `?${query}` : ""}`,
    );
  },
  get(id: string): Promise<{ data: AdminProduct }> {
    return request<{ data: AdminProduct }>(`/admin/products/${id}`);
  },
  create(body: CreateProductPayload): Promise<{ data: AdminProduct }> {
    return request<{ data: AdminProduct }>(`/products`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: UpdateProductPayload): Promise<void> {
    return request<void>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/products/${id}`, { method: "DELETE" });
  },
  createVariant(
    productId: string,
    body: CreateVariantPayload,
  ): Promise<{ data: ProductVariant }> {
    return request<{ data: ProductVariant }>(
      `/products/${productId}/variants`,
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  updateVariant(
    productId: string,
    variantId: string,
    body: UpdateVariantPayload,
  ): Promise<void> {
    return request<void>(`/products/${productId}/variants/${variantId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  removeVariant(productId: string, variantId: string): Promise<void> {
    return request<void>(`/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    });
  },
},
```

### Step 3 – `lib/validations.ts`: Make variant schema dynamic

The current `variantSchema` hardcodes `color` and `size`. Replace with a factory that generates a schema from the current attribute names:

```ts
// Dynamic variant schema based on attribute names from the product
export function createVariantSchema(attributeNames: string[]) {
  const attrShape = Object.fromEntries(
    attributeNames.map((name) => [
      name,
      z.string().min(1, `Vui lòng nhập ${name}`),
    ]),
  );
  return z.object({
    ...attrShape,
    price: z
      .string()
      .min(1, "Vui lòng nhập giá")
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Giá phải lớn hơn 0"),
    stock: z
      .string()
      .min(1, "Vui lòng nhập tồn kho")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0,
        "Tồn kho không được âm",
      ),
  });
}
```

Keep the old `variantSchema` export for backward compat (or remove if nothing else uses it — check usages first).

Update `addProductSchema` to include `default_price` and `category_id`:

```ts
export const addProductSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên sản phẩm"),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
  default_price: z
    .string()
    .min(1, "Vui lòng nhập giá mặc định")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Giá không hợp lệ"),
  description: z.string().optional(),
});
```

Add type export:

```ts
export type AddProductInput = z.infer<typeof addProductSchema>;
```

(replace existing `AddProductInput` if already exported)

## Notes

- `adminProducts.create` posts to `/products` (not `/admin/products`) — the create/update/delete endpoints are on the base product resource with admin auth.
- `adminProducts.get` uses the new `/admin/products/:id` endpoint from Phase 1.
- `removeVariant` in `adminProducts` duplicates `api.delete` for variants but is co-located for discoverability.

## Todo

- [x] Add `CreateProductPayload`, `UpdateProductPayload`, `CreateVariantPayload`, `UpdateVariantPayload` to `types/api.ts`
- [x] Import new types in `lib/api.ts`
- [x] Add `get`, `create`, `update`, `remove`, `createVariant`, `updateVariant`, `removeVariant` to `adminProducts`
- [x] Replace `variantSchema` with `createVariantSchema` factory in `lib/validations.ts`
- [x] Update `addProductSchema` to include `category_id` and `default_price`
- [x] Verify TypeScript compiles: `cd frontend && npx tsc --noEmit`
