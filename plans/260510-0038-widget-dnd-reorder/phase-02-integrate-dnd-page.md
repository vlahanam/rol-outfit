# Phase 2: Integrate DnD into Widget List Page

## Overview
- **Priority**: High (depends on Phase 1)
- **Status**: ✓ Complete
- **File to modify**: `frontend/app/admin/(protected)/widgets/page.tsx`

## Context Links
- Phase 1 output: `frontend/components/admin/widgets/widget-sortable-row.tsx`
- API resource: `frontend/lib/api-resources.ts` → `adminWidgets.update(id, { display_order })`

## Key Insights
- `DndContext` wraps the whole `<table>`, NOT the `<tbody>` — sensors need to see full DOM
- Nested `SortableContext`: outer for roots, inner per expanded container
- `handleDragEnd` uses `roots.findIndex` (not `filteredRoots.findIndex`) so reorder works correctly even when search filter is active
- Rollback on API failure: reset `roots` from API + clear `children` cache (forces re-fetch on next expand)
- `PointerSensor` with `distance: 8` prevents accidental drags on click

## New Imports to Add
```ts
import {
  DndContext, closestCenter, PointerSensor,
  KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove,
  verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { WidgetSortableRow } from "@/components/admin/widgets/widget-sortable-row";
```

## Implementation Steps

### 1. Add sensors (inside component, before return)
```ts
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);
```

### 2. Add `findInAll` helper
```ts
function findInAll(id: string): Widget | undefined {
  return roots.find((w) => w.id === id) ??
    Object.values(children).flat().find((w) => w.id === id);
}
```

### 3. Add `updateDisplayOrders` (optimistic + async rollback)
```ts
async function updateDisplayOrders(list: Widget[]) {
  const updates = list
    .map((w, i) => ({ w, order: i + 1 }))
    .filter(({ w, order }) => w.display_order !== order);
  try {
    await Promise.all(updates.map(({ w, order }) =>
      api.adminWidgets.update(w.id, { display_order: order }),
    ));
  } catch {
    // rollback: re-fetch roots and clear children cache
    api.adminWidgets.list({ limit: 100 })
      .then((res) => setRoots(res.data ?? []))
      .catch(() => {});
    setChildren({});
  }
}
```

### 4. Add `handleDragEnd`
```ts
function handleDragEnd({ active, over }: DragEndEvent) {
  if (!over || active.id === over.id) return;
  const activeW = findInAll(String(active.id));
  const overW = findInAll(String(over.id));
  if (!activeW || !overW || activeW.parent_id !== overW.parent_id) return;

  if (activeW.parent_id === null) {
    const oldIdx = roots.findIndex((w) => w.id === active.id);
    const newIdx = roots.findIndex((w) => w.id === over.id);
    const newRoots = arrayMove(roots, oldIdx, newIdx);
    setRoots(newRoots);
    updateDisplayOrders(newRoots);
  } else {
    const parentId = activeW.parent_id;
    const kids = children[parentId] ?? [];
    const oldIdx = kids.findIndex((w) => w.id === active.id);
    const newIdx = kids.findIndex((w) => w.id === over.id);
    const newKids = arrayMove(kids, oldIdx, newIdx);
    setChildren((prev) => ({ ...prev, [parentId]: newKids }));
    updateDisplayOrders(newKids);
  }
}
```

### 5. Replace `renderRow` with `WidgetSortableRow` in JSX

Remove the `renderRow` function entirely. Update `<tbody>` content:

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={filteredRoots.map((w) => w.id)}
    strategy={verticalListSortingStrategy}
  >
    {filteredRoots.map((w) => (
      <React.Fragment key={w.id}>
        <WidgetSortableRow
          widget={w}
          isChild={false}
          expanded={!!expanded[w.id]}
          onToggleExpand={loadChildren}
          onEdit={(id) => router.push(`/admin/widgets/${id}/edit`)}
          onDelete={setDeleteTarget}
        />
        {expanded[w.id] && (
          <SortableContext
            items={(children[w.id] ?? []).map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {(children[w.id] ?? []).map((child) => (
              <WidgetSortableRow
                key={child.id}
                widget={child}
                isChild={true}
                expanded={false}
                onToggleExpand={() => {}}
                onEdit={(id) => router.push(`/admin/widgets/${id}/edit`)}
                onDelete={setDeleteTarget}
              />
            ))}
          </SortableContext>
        )}
      </React.Fragment>
    ))}
  </SortableContext>
</DndContext>
```

Note: `DndContext` must wrap `<table>` directly (move it outside `<table>`, wrap `<table>` inside it). `SortableContext` goes inside `<tbody>`.

### 6. Add `fetchRoots` helper for rollback reuse
```ts
function fetchRoots() {
  api.adminWidgets
    .list({ limit: 100 })
    .then((res) => setRoots(res.data ?? []))
    .catch(() => {});
}
```
Use in both `useEffect` and rollback in `updateDisplayOrders`.

## Todo
- [x] Add DnD imports
- [x] Add sensors
- [x] Add `findInAll` helper
- [x] Add `updateDisplayOrders` with rollback
- [x] Add `handleDragEnd`
- [x] Add `fetchRoots` helper, refactor initial `useEffect` to use it
- [x] Remove `renderRow` function
- [x] Wrap table with `DndContext`, replace tbody content with `SortableContext` + `WidgetSortableRow`
- [x] Run `npx tsc --noEmit` — verify zero errors
- [x] Manual test: drag root, drag child, verify order persists

## Success Criteria
- No TypeScript errors
- Root containers draggable and reorderable
- Children draggable within their parent
- Page stays under 200 LOC after refactor
- Search filter continues to work during/after drag
