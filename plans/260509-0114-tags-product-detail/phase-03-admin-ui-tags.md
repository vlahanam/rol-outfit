# Phase 03 — Admin UI: Tag CRUD Pages

## Context Links
- Depends on: Phase 01 (tag endpoints live)
- UI pattern reference: `frontend/app/admin/(protected)/categories/page.tsx`, `categories/add/page.tsx`, `categories/[id]/edit/page.tsx`
- Sidebar: `frontend/components/admin/AdminSidebar.tsx`
- API client patterns: `frontend/lib/api-resources.ts` (see `adminCategories`)
- Validation pattern: `frontend/lib/validations.ts` (see `addCategorySchema`, `editCategorySchema`)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Description:** Build admin Tag CRUD: list page with table + delete-modal, separate Add and Edit pages (matches category UX). Add `Thẻ Tag` entry to AdminSidebar. Window picker uses native `<input type="datetime-local">`.

## Key Insights
- Mirrors category admin UX closely (separate pages, NOT modals — matches existing pattern). User spec mentioned "modals" but project pattern is page-based; use the page approach for consistency. Note in unresolved Qs.
- `datetime-local` input ↔ ISO timestamp conversion: read `value` (e.g. `"2026-05-12T14:30"`) and convert via `new Date(v).toISOString()` on submit; on load convert ISO → local datetime string by slicing `iso.slice(0,16)`.
- Empty datetime-local string → send `null` to API (not `""` — backend would reject).
- Active/inactive badge computed client-side: `isActive(tag) = (start_at == null || new Date(start_at) <= now) && (end_at == null || new Date(end_at) >= now)`.

## Requirements

### Functional
- `/admin/tags` — list page: search by name/slug, status filter (Active / Inactive / All), table with edit/delete actions
- `/admin/tags/add` — create form: name (required), start_at (optional), end_at (optional)
- `/admin/tags/[id]/edit` — edit form: same fields, prefilled
- DeleteConfirmModal reused (same component used for categories)
- Sidebar entry: `Thẻ Tag` icon `Tag` from lucide-react, path `/admin/tags`

### Non-Functional
- All files ≤ 200 lines (list page is the largest — split helper if needed)
- Vietnamese-only labels (admin section policy)
- Reuse `api.adminTags` client and zod schemas

## Architecture

### Type additions (`frontend/types/api.ts`)

```ts
export interface Tag {
  id: string;
  name: string;
  slug: string;
  start_at: string | null; // ISO 8601
  end_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface CreateTagPayload {
  name: string;
  start_at?: string | null;
  end_at?: string | null;
}
export interface UpdateTagPayload {
  name?: string;
  start_at?: string | null;
  end_at?: string | null;
}
```

### API client additions (`frontend/lib/api-resources.ts`)

```ts
export const adminTags = {
  list(params?: { page?: number; limit?: number }): Promise<ApiResponse<Tag[]>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<ApiResponse<Tag[]>>(`/admin/tags${query ? `?${query}` : ""}`);
  },
  listPublic(): Promise<ApiResponse<Tag[]>> {
    return request<ApiResponse<Tag[]>>(`/tags?limit=100`);
  },
  get(id: string): Promise<{ data: Tag }> {
    return request<{ data: Tag }>(`/admin/tags/${id}`);
  },
  create(body: CreateTagPayload): Promise<{ data: Tag }> {
    return request<{ data: Tag }>(`/tags`, { method: "POST", body: JSON.stringify(body) });
  },
  update(id: string, body: UpdateTagPayload): Promise<void> {
    return request<void>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/tags/${id}`, { method: "DELETE" });
  },
};
```
Then `export const api = { ... adminTags }` in `lib/api.ts`.

### Validation (`frontend/lib/validations.ts`)

```ts
export const addTagSchema = z.object({
  name: z.string().min(2, "Tên thẻ tag phải có ít nhất 2 ký tự"),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
}).refine(d => !d.start_at || !d.end_at || new Date(d.start_at) <= new Date(d.end_at),
  { message: "Thời gian kết thúc phải sau thời gian bắt đầu", path: ["end_at"] });

export const editTagSchema = addTagSchema; // same shape
```

### Pages

#### `frontend/app/admin/(protected)/tags/page.tsx`
- Mirrors `categories/page.tsx` structure
- Columns: Tên | Slug | Bắt đầu | Kết thúc | Trạng thái | Hành động
- Status filter: "Tất cả" / "Đang hoạt động" / "Hết hạn / chưa bắt đầu"
- Format date with `toLocaleString('vi-VN')`
- `DeleteConfirmModal` integration identical to categories
- If file approaches 200 lines, extract `<TagsTable>` to `components/admin/tags-table.tsx`

#### `frontend/app/admin/(protected)/tags/add/page.tsx`
- Form fields: name, start_at, end_at (datetime-local)
- Submit converts datetime-local strings via:
  ```ts
  const toIso = (v: string) => v ? new Date(v).toISOString() : null;
  await api.adminTags.create({
    name: formData.name,
    start_at: toIso(formData.start_at),
    end_at: toIso(formData.end_at),
  });
  ```
- On success: `router.push("/admin/tags")`

#### `frontend/app/admin/(protected)/tags/[id]/edit/page.tsx`
- Loads via `api.adminTags.get(id)`
- Pre-fill datetime-local inputs:
  ```ts
  const toLocal = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0,16) : "";
  ```
- Patches via `api.adminTags.update(id, { ... })`

### Sidebar update (`AdminSidebar.tsx`)

Insert after the `Danh Mục` entry:
```ts
import { Tag } from "lucide-react";
// in menuItems
{ icon: Tag, label: "Thẻ Tag", path: "/admin/tags" },
```

## Related Code Files

### Create
- `frontend/app/admin/(protected)/tags/page.tsx`
- `frontend/app/admin/(protected)/tags/add/page.tsx`
- `frontend/app/admin/(protected)/tags/[id]/edit/page.tsx`
- (optional, only if needed for line budget) `frontend/components/admin/tags-table.tsx`

### Modify
- `frontend/types/api.ts` (Tag, payload types)
- `frontend/lib/api-resources.ts` (adminTags export)
- `frontend/lib/api.ts` (re-export)
- `frontend/lib/validations.ts` (addTagSchema)
- `frontend/components/admin/AdminSidebar.tsx` (one menu item)

## Implementation Steps

1. Add types to `types/api.ts`
2. Add `adminTags` resource to `api-resources.ts`; re-export in `api.ts`
3. Add `addTagSchema` and `editTagSchema` to `validations.ts`
4. Create `app/admin/(protected)/tags/page.tsx` modeled on category list
5. Create `app/admin/(protected)/tags/add/page.tsx`
6. Create `app/admin/(protected)/tags/[id]/edit/page.tsx`
7. Update `AdminSidebar.tsx` to include `Thẻ Tag` entry between `Danh Mục` and `Giỏ Hàng`
8. Run `npm run build` (or `tsc --noEmit`) — verify no TS errors
9. Manual smoke: navigate to `/admin/tags`, create with various window combos, edit, delete

## Todo List

- [ ] `Tag`, `CreateTagPayload`, `UpdateTagPayload` types added
- [ ] `adminTags` API client added and re-exported
- [ ] `addTagSchema` / `editTagSchema` added with cross-field refine
- [ ] List page with search + status filter + delete modal
- [ ] Add page with datetime-local handling
- [ ] Edit page with pre-fill conversion
- [ ] Sidebar entry added with `Tag` icon
- [ ] Frontend builds without TS errors
- [ ] All four scenarios verified manually (no window, only start, only end, both)

## Success Criteria
- Sidebar shows `Thẻ Tag` between `Danh Mục` and `Giỏ Hàng`
- List page renders all tags (admin endpoint), with active/inactive badge correct against current time
- Create with empty start_at + empty end_at posts `null`/`null` (always-active)
- Create with start_at only posts `start_at` ISO + `null` end_at
- Edit reload preserves window values
- Delete uses confirm modal then disappears from list
- No file exceeds 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Timezone confusion: `datetime-local` is browser-local but we send ISO | `new Date(localStr).toISOString()` correctly emits UTC; document on form ("Theo giờ địa phương") |
| Empty string vs null for unset window | Always send `null` (not `""`) via `toIso` helper |
| 200-line budget on list page | Extract `<TagsTable>` to component dir if needed |
| Stale slug after rename | Backend regenerates on update; UI shows updated slug after refetch — display from response |

## Security Considerations
- Pages are inside `(protected)` route group — admin auth enforced by parent layout
- Confirm modal prevents accidental delete

## Next Steps
- Phase 04 reuses `api.adminTags.listPublic()` (or admin list with `limit=100`) to populate the assignment dropdown
