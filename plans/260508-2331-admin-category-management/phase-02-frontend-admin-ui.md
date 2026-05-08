---
phase: 02
title: Frontend — Admin Category UI
status: todo
priority: high
---

# Phase 02 — Frontend: Admin Category UI

## Context Links

- Types: `frontend/types/api.ts`
- API client: `frontend/lib/api.ts`
- Validations: `frontend/lib/validations.ts`
- Sidebar: `frontend/components/admin/AdminSidebar.tsx`
- Pattern reference (list): `frontend/app/admin/(protected)/users/page.tsx`
- Pattern reference (add): `frontend/app/admin/(protected)/users/add/page.tsx`
- Pattern reference (edit): `frontend/app/admin/(protected)/users/[id]/edit/page.tsx`
- Delete modal: `frontend/components/admin/DeleteConfirmModal.tsx`

## Overview

- **Priority:** High
- **Status:** Todo
- **Depends on:** Phase 01 (admin endpoints must exist)

## Key Insights

- `Category` type already exists in `types/api.ts` — only payload types are missing.
- API client uses `api.get<>('/categories?...')` inline in products page — needs dedicated `adminCategories` namespace.
- Status values: `1 = Hiển thị`, `2 = Ẩn` (matches backend `CATEGORY_STATUS_ACTIVE=1`, `CATEGORY_STATUS_HIDDEN=2`).
- No image upload needed for categories — simpler form than products.
- Follow exact same patterns as users (list/add/edit) for consistency.

## Requirements

- Sidebar: "Danh Mục" link with `Tags` icon from lucide-react
- List page: table with Name, Slug, Status badge, Created date, Edit/Delete actions; search by name
- Add page: form with Name (required, min 2), Description (optional), submit → redirect to list
- Edit page: pre-populated form with Name, Description, Status select; same layout as edit user

## Architecture

```
frontend/
  app/admin/(protected)/
    categories/
      page.tsx               ← list all categories
      add/page.tsx           ← create form
      [id]/edit/page.tsx     ← edit form
  components/admin/
    AdminSidebar.tsx          ← add Danh Mục menu item
  lib/
    api.ts                    ← add adminCategories namespace
    validations.ts            ← add addCategorySchema, editCategorySchema
  types/
    api.ts                    ← add CreateCategoryPayload, UpdateCategoryPayload
```

## Related Code Files

**Modify:**
- `frontend/types/api.ts`
- `frontend/lib/api.ts`
- `frontend/lib/validations.ts`
- `frontend/components/admin/AdminSidebar.tsx`

**Create:**
- `frontend/app/admin/(protected)/categories/page.tsx`
- `frontend/app/admin/(protected)/categories/add/page.tsx`
- `frontend/app/admin/(protected)/categories/[id]/edit/page.tsx`

## Implementation Steps

### Step 1 — Add payload types to `types/api.ts`

After the existing `Category` interface, add:
```ts
export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  status?: number;
}
```

### Step 2 — Add `adminCategories` to `lib/api.ts`

Import the new types. Add after `adminProducts`:
```ts
adminCategories: {
  list(params?: { page?: number; limit?: number }): Promise<ApiResponse<Category[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<ApiResponse<Category[]>>(
      `/admin/categories${query ? `?${query}` : ""}`,
    );
  },
  get(id: string): Promise<{ data: Category }> {
    return request<{ data: Category }>(`/admin/categories/${id}`);
  },
  create(body: CreateCategoryPayload): Promise<{ data: Category }> {
    return request<{ data: Category }>(`/categories`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: UpdateCategoryPayload): Promise<void> {
    return request<void>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/categories/${id}`, { method: "DELETE" });
  },
},
```

### Step 3 — Add validation schemas to `lib/validations.ts`

```ts
export const addCategorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
});

export const editCategorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
  status: z.string(),
});
```

### Step 4 — Add sidebar link to `AdminSidebar.tsx`

Import `Tags` from `lucide-react`. Add to `menuItems` array after "Sản Phẩm":
```ts
{ icon: Tags, label: 'Danh Mục', path: '/admin/categories' },
```

### Step 5 — Create list page `categories/page.tsx`

Pattern: exact same structure as `users/page.tsx`.

Key elements:
- `useEffect` → `api.adminCategories.list({ limit: 100 })`
- Search filter by `name` or `slug` (case-insensitive)
- Status filter: select "Tất cả", "Hiển thị" (status=1), "Ẩn" (status=2)
- Table columns: Tên | Slug | Mô tả (truncated 50 chars) | Trạng Thái | Ngày tạo | Hành Động
- Status badge: status=1 → green "Hiển thị", status=2 → gray "Ẩn"
- Actions: Edit button → `/admin/categories/${cat.id}/edit`, Delete button → `DeleteConfirmModal`
- Header: "Quản Lý Danh Mục" title + "Thêm Danh Mục" link button → `/admin/categories/add`
- `handleDelete` → `api.adminCategories.remove(deleteId)` → filter from state

### Step 6 — Create add page `categories/add/page.tsx`

Pattern: same as `users/add/page.tsx`.

Form fields:
- `name` (required) — text input
- `description` (optional) — textarea

On submit:
- Validate with `addCategorySchema`
- Call `api.adminCategories.create({ name, description })`
- On success → `router.push("/admin/categories")`
- On error → show error message

### Step 7 — Create edit page `categories/[id]/edit/page.tsx`

Pattern: same as `users/[id]/edit/page.tsx`.

On mount: `api.adminCategories.get(id)` → populate form.

Form fields:
- `name` (required)
- `description` (optional) — textarea
- `status` — select: "Hiển thị" (1) / "Ẩn" (2)

On submit:
- Validate with `editCategorySchema`
- Call `api.adminCategories.update(id, { name, description, status: statusValue })`
- On success → `router.push("/admin/categories")`
- Show slug as read-only info (auto-generated server-side)

Status mapping constants (add to `lib/api.ts` or inline in page):
```ts
export const CATEGORY_STATUS_LABEL: Record<number, string> = { 1: "Hiển thị", 2: "Ẩn" };
export const CATEGORY_STATUS_VALUE: Record<string, number> = { "Hiển thị": 1, "Ẩn": 2 };
```

## Todo

- [ ] Add `CreateCategoryPayload`, `UpdateCategoryPayload` to `types/api.ts`
- [ ] Add `adminCategories` namespace to `lib/api.ts`
- [ ] Add `CATEGORY_STATUS_LABEL` / `CATEGORY_STATUS_VALUE` constants to `lib/api.ts`
- [ ] Add `addCategorySchema`, `editCategorySchema` to `lib/validations.ts`
- [ ] Add `Tags` icon + "Danh Mục" item to `AdminSidebar.tsx`
- [ ] Create `categories/page.tsx` (list)
- [ ] Create `categories/add/page.tsx` (create form)
- [ ] Create `categories/[id]/edit/page.tsx` (edit form)
- [ ] TypeScript compile check: `cd frontend && npx tsc --noEmit`

## Success Criteria

- Sidebar shows "Danh Mục" link, active highlight works
- List page loads all categories, search and status filter work, delete works
- Add page creates a category, redirects to list
- Edit page loads existing data, updates category, redirects to list
- Status badge correctly shows Hiển thị / Ẩn
- No TypeScript errors

## Risk Assessment

- **Low**: Pure additive frontend work, no shared state or route conflicts.
- Slug is auto-generated on backend; no slug input needed on frontend → simpler than products.
