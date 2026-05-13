# Phase 1: Create WidgetSortableRow Component

## Overview
- **Priority**: High (must exist before Phase 2)
- **Status**: ✓ Complete
- **File to create**: `frontend/components/admin/widgets/widget-sortable-row.tsx`

## Context Links
- Current list page: `frontend/app/admin/(protected)/widgets/page.tsx`
- Widget type: `frontend/types/api.ts` → `Widget`

## Key Insights
- Extract the existing `renderRow` logic from `page.tsx` into a standalone component
- The drag handle (GripVertical icon) gets the `listeners` from `useSortable` — NOT the whole `<tr>`
- `isDragging` should reduce opacity to 0.5 for visual feedback
- Props must pass all callbacks to avoid closures over stale state

## Props Interface
```ts
interface WidgetSortableRowProps {
  widget: Widget;
  isChild: boolean;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (widget: Widget) => void;
}
```

## Implementation Steps
1. Create directory `frontend/components/admin/widgets/`
2. Create `widget-sortable-row.tsx`:
   - Import `useSortable` from `@dnd-kit/sortable`
   - Import `CSS` from `@dnd-kit/utilities`
   - Import `GripVertical`, `ChevronDown`, `ChevronRight`, `Edit`, `Trash2` from `lucide-react`
   - Import `WIDGET_STATUS_LABEL`, `WIDGET_TYPE_LABEL` from `@/lib/api`
   - Import `Widget` from `@/types/api`
   - Call `useSortable({ id: widget.id })` → destructure `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, `isDragging`
   - Render `<tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}`
   - First `<td>`: drag handle button with `{...attributes} {...listeners}` containing `<GripVertical />`, then expand chevron (if not child and type=container), then name
   - Remaining columns: type label, display_order, status badge, created_at, edit+delete buttons
   - Use `"use client"` directive

## Column Structure (mirrors current `renderRow`)
| Column | Content |
|--------|---------|
| Name | drag handle + expand chevron + name text (indented if isChild) |
| Loại | `WIDGET_TYPE_LABEL[widget.type]` |
| Thứ Tự | `widget.display_order` (center aligned) |
| Trạng Thái | green/gray badge |
| Ngày Tạo | `toLocaleDateString("vi-VN")` |
| Hành Động | Edit (blue) + Delete (red) buttons |

## Todo
- [x] Create `frontend/components/admin/widgets/` directory
- [x] Create `widget-sortable-row.tsx` with `useSortable` hook
- [x] Apply drag handle to GripVertical button only (not whole row)
- [x] Verify `isDragging` opacity feedback works

## Success Criteria
- Component renders identical columns to current `renderRow`
- Drag handle visible as GripVertical icon at left of name cell
- No TypeScript errors
