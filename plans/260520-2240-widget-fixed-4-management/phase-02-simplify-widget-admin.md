---
phase: 2
title: Frontend – Đơn Giản Hóa Widget Admin
status: completed
completed: 2026-05-20
---

# Phase 2 – Đơn Giản Hóa Widget Admin

## Overview

Loại bỏ Add/Delete/DnD reorder. Chỉ giữ edit. Simplify list page thành table tĩnh hiển thị 4 widget cố định.

## Files

| File | Action |
|------|--------|
| `frontend/app/admin/(protected)/widgets/page.tsx` | MODIFY – bỏ DnD, add button, delete, search, children |
| `frontend/app/admin/(protected)/widgets/add/page.tsx` | DELETE |
| `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` | MODIFY – type thành read-only |
| `frontend/components/admin/widgets/widget-sortable-row.tsx` | MODIFY → rename to `widget-row.tsx`, bỏ DnD/delete |
| `frontend/components/admin/widgets/widget-constants.ts` | DELETE (unused sau khi edit page bỏ type select) |
| `frontend/lib/api.ts` | MODIFY – update `WIDGET_TYPE_LABEL` |

## 1. `lib/api.ts` – Update WIDGET_TYPE_LABEL

```ts
export const WIDGET_TYPE_LABEL: Record<string, string> = {
  "banner-slider":     "Banner Slider",
  "image-scroll-list": "Danh sách ảnh cuộn",
  "two-large-images":  "Hai ảnh lớn",
  "one-large-two-small": "Một ảnh lớn, hai ảnh nhỏ",
  "slider-and-large-image": "Slider và ảnh lớn",
};
```

## 2. `widget-row.tsx` (rename từ widget-sortable-row.tsx)

Xóa toàn bộ DnD code (`useSortable`, `GripVertical`, `useSortable` import). Xóa `onDelete` prop. Xóa expand/collapse children logic.

Interface đơn giản:
```ts
interface WidgetRowProps {
  widget: Widget;
  onEdit: (id: string) => void;
}
```

Row chỉ render: Name | Type | Order | Status | CreatedAt | Edit button.

## 3. `widgets/page.tsx` – Xóa DnD + Add + Delete

**Xóa:**
- Import: `DndContext`, `SortableContext`, `useSensor*`, `arrayMove`, `DragEndEvent`, DnD packages
- Import: `DeleteConfirmModal`, `Plus`, `Link`
- State: `children`, `expanded`, `deleteTarget`, `isSaving`, `loadedParents`, `sensors`, `search`
- Functions: `loadChildren`, `findInAll`, `updateDisplayOrders`, `handleDragEnd`, `handleDelete`, `fetchRoots`
- JSX: search input, Add button, DndContext wrapper, SortableContext, expand/collapse, delete modal

**Giữ:**
- State: `roots`, `loading`, `error`
- `useEffect` fetch list (chỉ roots, `limit: 4`)
- Table với `WidgetRow` (không phải SortableRow)
- Error display

**Kết quả:** Component ~60 LOC, không có dependencies DnD.

## 4. `edit/page.tsx` – Type Read-Only

Thay `<select>` cho type bằng text hiển thị label:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
  <p className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
    {WIDGET_TYPE_LABEL[form.type] ?? form.type}
  </p>
</div>
```

Bỏ `type` khỏi `editWidgetSchema` validate và API update call (chỉ update name + status).

Import: bỏ `WIDGET_TYPES`, `widget-constants`; thêm `WIDGET_TYPE_LABEL` từ `@/lib/api`.

## 5. Delete add/page.tsx và widget-constants.ts

Xóa 2 file:
- `frontend/app/admin/(protected)/widgets/add/page.tsx`
- `frontend/components/admin/widgets/widget-constants.ts`

## Dependency Cleanup

Sau khi bỏ DnD khỏi `page.tsx` và `widget-sortable-row.tsx`, kiểm tra `@dnd-kit/*` có còn được dùng ở nơi khác không. Nếu không → xem xét xóa khỏi `package.json` (optional, không bắt buộc).

## Todo

- [x] Update `WIDGET_TYPE_LABEL` trong `lib/api.ts`
- [x] Tạo `widget-row.tsx` (từ widget-sortable-row.tsx, bỏ DnD/delete)
- [x] Xóa `widget-sortable-row.tsx` (sau khi tạo widget-row.tsx)
- [x] Simplify `widgets/page.tsx` – bỏ DnD, add, delete, search
- [x] Update `edit/page.tsx` – type read-only, chỉ update name+status
- [x] Xóa `add/page.tsx`
- [x] Xóa `widget-constants.ts`
- [x] Kiểm tra TypeScript compile (`npx tsc --noEmit`)
