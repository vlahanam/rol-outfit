# @dnd-kit Package Research: Hierarchical Drag-Drop Reordering

**Date**: 2026-05-10  
**Scope**: Admin widget list with 2-level hierarchy (root containers + children)  
**Goal**: Determine @dnd-kit package requirements and implementation pattern for table-based drag-drop reordering

---

## Executive Summary

**Recommendation**: Use `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` for your hierarchical widget admin list. The flat-list pattern with visual nesting best suits dnd-kit's architecture — avoid trying to make dnd-kit understand tree semantics; instead, flatten the data for sorting and track parent relationships separately.

**Next.js 15 Compatibility**: ✓ Safe. No blocking issues in latest versions. A React 19 support issue (#1511) exists but doesn't prevent Next.js 15 adoption.

---

## 1. Core Packages Required

### Install
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Package Roles

| Package | Purpose | Required? |
|---------|---------|-----------|
| `@dnd-kit/core` | Drag orchestration (DndContext, useDraggable, useDroppable) | ✓ Yes |
| `@dnd-kit/sortable` | Sortable preset (SortableContext, useSortable) | ✓ Yes |
| `@dnd-kit/utilities` | Utility fns (arrayMove, CSS transforms) | ✓ Yes |
| `@dnd-kit/modifiers` | Snap-to-grid, restrict movement | Optional (not needed for basic case) |

**Key point**: `@dnd-kit/sortable` is a **preset** that composes `useDraggable` + `useDroppable` into `useSortable` — simpler for list reordering than raw core hooks.

---

## 2. How @dnd-kit/sortable Works for Your Hierarchical Data

### The Flat-List Pattern (Recommended)

dnd-kit **doesn't natively understand tree hierarchies**. Instead, you flatten your 2-level structure:

```
Display:
  Container A (depth=0, draggable)
    ├─ Widget 1 (depth=1, draggable)
    └─ Widget 2 (depth=1, draggable)
  Container B (depth=0, draggable)

For dnd-kit:
  [Container A, Widget 1, Widget 2, Container B, ...]  ← Flat array with parent_id tracking
```

**Why flatten?**
- `SortableContext` expects a simple ID array `['A', 'W1', 'W2', 'B', ...]`
- Drag position is calculated as index in this flat array
- You handle parent-child relationships via data (parent_id field), not DOM structure

### State Management Pattern

```typescript
// Your data structure
type Widget = {
  id: string;
  name: string;
  parent_id?: string;  // null/undefined for roots, container id for children
  display_order: number;  // Used for sorting
}

// For SortableContext
const flatIds = widgets.map(w => w.id);  // ['A', 'W1', 'W2', ...]

// Render with visual indentation
{widgets.map(widget => (
  <div style={{ paddingLeft: widget.parent_id ? '24px' : '0' }}>
    {/* render draggable item */}
  </div>
))}
```

---

## 3. Multiple Independent Sortable Lists Pattern

### Best Approach for Your Use Case

Instead of creating a SortableContext per expanded container (complex nesting), **nest SortableContext components by GROUP**:

```typescript
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  {/* Root containers list */}
  <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
    {roots.map(r => (
      <div key={r.id}>
        <RootItem id={r.id} />
        
        {/* Children list (only rendered if expanded) */}
        {expandedIds.has(r.id) && (
          <SortableContext items={childrenIds[r.id]} strategy={verticalListSortingStrategy}>
            {children[r.id]?.map(c => (
              <ChildItem key={c.id} id={c.id} parentId={r.id} />
            ))}
          </SortableContext>
        )}
      </div>
    ))}
  </SortableContext>
</DndContext>
```

**Key insight**: Nest SortableContext by container, not by visual nesting. Each expanded container gets its own SortableContext with its children's IDs.

### Handling Drag Events Across Containers

In your `onDragEnd` handler, detect:
- **Same-level reorder** (`parent_id` unchanged): Update display_order within that group
- **Between-container move** (`parent_id` changed): Update both parent_id and display_order

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const activeWidget = findWidgetById(active.id);
  const overWidget = findWidgetById(over.id);

  if (activeWidget.parent_id === overWidget.parent_id) {
    // Same container: reorder display_order
    const newOrder = arrayMove(
      containerWidgets,
      activeWidget.display_order,
      overWidget.display_order
    );
    updateDisplayOrder(newOrder);
  } else {
    // Different container: change parent_id + reorder
    updateParentAndOrder(activeWidget.id, overWidget.parent_id, overWidget.display_order);
  }
};
```

**Limitation**: dnd-kit doesn't prevent moving items across containers by default — you implement that logic in `onDragEnd`.

---

## 4. The `arrayMove` Utility

### What It Does

Provided by `@dnd-kit/sortable/utilities`:

```typescript
import { arrayMove } from '@dnd-kit/sortable';

const reordered = arrayMove(array, fromIndex, toIndex);
```

**Usage**:
```typescript
// Get indices from items
const activeIndex = widgets.findIndex(w => w.id === event.active.id);
const overIndex = widgets.findIndex(w => w.id === event.over.id);

const reordered = arrayMove(widgets, activeIndex, overIndex);

// Update your state
setWidgets(reordered);

// Then persist each widget's new display_order
updateAllDisplayOrders(reordered.map((w, idx) => ({ id: w.id, display_order: idx })));
```

---

## 5. Sensors: PointerSensor & KeyboardSensor

### Default Behavior (No Config Needed)

```typescript
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor)
);

<DndContext sensors={sensors}>
  {/* ... */}
</DndContext>
```

**DndContext uses both by default** if you don't specify `sensors`.

### Sensor Details

| Sensor | Trigger | Key Behavior |
|--------|---------|--------------|
| **PointerSensor** | Mouse/touch/pen pointer events | Activates on primary pointer; handles touch disambiguation |
| **KeyboardSensor** | Space/Enter to activate, arrow keys to move | Default step: 25px; customize via `keyboardCodes` |

### When to Customize

```typescript
// Require small delay before drag starts (prevents accidental drags)
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8,  // Move 8px before drag initiates
  },
})

// Custom keyboard movement speed
useSensor(KeyboardSensor, {
  keyboardCodes: {
    start: [KeyCode.Space, KeyCode.Enter],
    cancel: [KeyCode.Escape],
    up: [KeyCode.ArrowUp],
    down: [KeyCode.ArrowDown],
  },
  coordinateGetter: keyboardCoordinateGetter,  // Custom step size
})
```

---

## 6. Optimistic UI vs API Persistence

### Recommended Pattern

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  // 1. OPTIMISTIC: Update local state immediately
  const reordered = arrayMove(
    widgets,
    getIndex(active.id),
    getIndex(over.id)
  );
  setWidgets(reordered);

  // 2. PERSIST: Call API in background
  try {
    await updateDisplayOrders(
      reordered.map((w, idx) => ({ id: w.id, order: idx }))
    );
  } catch (err) {
    // 3. ROLLBACK: Revert local state on failure
    console.error('Drag failed:', err);
    setWidgets(widgets);  // Restore previous state
  }
};
```

### Key Benefits

- **Optimistic sorting**: DOM moves immediately (smooth UX)
- **Deferred API call**: Persistence happens async
- **Rollback on failure**: Network errors revert UI

### Interaction with External Data Fetching

**Important**: If using React Query or SWR:
- Disable automatic refetch during active drag
- Resume refetch only when `isDragging === false`

```typescript
const { data: widgets } = useQuery(
  ['widgets'],
  fetchWidgets,
  {
    enabled: !isDragging,  // Don't refetch while dragging
  }
);
```

This prevents mid-drag refetches from overwriting optimistic state.

---

## 7. Next.js 15 & React 19 Compatibility

### Status: ✓ Safe for Next.js 15

**No blocking issues detected** for Next.js 15 adoption.

**Note on React 19**: Issue #1511 requests React 19 support, but:
- Not a hard blocker for Next.js 15 (which can run React 18)
- No evidence of breaking incompatibilities in current versions
- Monitor GitHub releases for React 19 support

### Package Versions to Use

```json
{
  "@dnd-kit/core": "^6.x.x",
  "@dnd-kit/sortable": "^7.x.x",
  "@dnd-kit/utilities": "^3.x.x"
}
```

**No special config** needed in `next.config.js`. dnd-kit is client-side and works with Next.js 15's default build.

---

## 8. Table-Based Layout Implementation

### Key Difference: No Card Wrapper

Instead of cards, render table rows:

```typescript
<div style={{ display: 'table', width: '100%' }}>
  <SortableContext items={rootIds}>
    {roots.map(root => (
      <div key={root.id} style={{ display: 'table-row' }}>
        <RootRow id={root.id} />
        
        {expandedIds.has(root.id) && (
          <SortableContext items={childrenIds[root.id]}>
            {children[root.id]?.map(child => (
              <ChildRow key={child.id} id={child.id} />
            ))}
          </SortableContext>
        )}
      </div>
    ))}
  </SortableContext>
</div>
```

Or use actual `<table>`:

```typescript
<table>
  <tbody>
    <SortableContext items={rootIds}>
      {roots.map(root => (
        <React.Fragment key={root.id}>
          <RootRow id={root.id} />
          {expandedIds.has(root.id) && (
            <SortableContext items={childrenIds[root.id]}>
              {children[root.id]?.map(child => (
                <ChildRow key={child.id} id={child.id} />
              ))}
            </SortableContext>
          )}
        </React.Fragment>
      ))}
    </SortableContext>
  </tbody>
</table>
```

### Styling the Draggable Item

```typescript
const SortableTableRow = ({ id, item }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>Drag handle icon</td>
      <td>{item.name}</td>
      {/* ... */}
    </tr>
  );
};
```

**Key CSS utilities**:
```typescript
import { CSS } from '@dnd-kit/utilities';  // Transform helpers
```

---

## Architecture Decision: Flat vs Tree

### Your Current Setup
- **Flat rendering** with parent_id tracking ✓ **Matches dnd-kit model**
- **Visual nesting via CSS/indentation** ✓ **Works great**
- **Separate SortableContext per container** ✓ **Recommended**

### Alternative (Not Recommended)
- dnd-kit-sortable-tree library (for true tree structures)
- Trade-off: More complex, less flexibility, adds a dependency

**Verdict**: Stick with your flat approach + separate SortableContext nesting. It's the pattern dnd-kit designers recommend.

---

## Implementation Checklist

- [ ] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] Wrap admin page in `<DndContext sensors={useSensors(...)}>` with PointerSensor + KeyboardSensor
- [ ] Create flat ID array: `[...rootIds, ...childIds]` per expansion state
- [ ] Nest SortableContext for roots + one per expanded container with child IDs
- [ ] Implement RootItem and ChildItem with `useSortable` hook
- [ ] Use `arrayMove` utility in `onDragEnd` to reorder
- [ ] Call API in background after optimistic UI update
- [ ] Implement rollback on API failure
- [ ] Add visual feedback: hover styles, transform animations via `CSS.Transform`
- [ ] Test table row rendering with Tailwind (no special dnd-kit config needed)
- [ ] Verify Next.js build passes (should be automatic)

---

## Unresolved Questions

1. **Drag handle vs row click**: Should entire row be draggable, or require drag-handle icon? (Affects sensor activation distance config)
2. **Cross-container constraints**: Are there business rules preventing children from moving between containers? (Affects `onDragEnd` validation logic)
3. **Undo/redo support**: Do admins need to undo reordering? (Requires snapshot pattern in `onDragStart`)
4. **Accessibility requirements**: Must keyboard-only users be able to reorder? (KeyboardSensor handles this, but test with screen readers)

---

## Sources

- [dnd-kit Official Docs](https://dndkit.com/)
- [React + dnd-kit Hierarchical Tree Implementation (DEV Community)](https://dev.to/fupeng_wang/react-dnd-kit-implement-tree-list-drag-and-drop-sortable-225l)
- [GitHub - dnd-kit Issue #1511: React 19 Support](https://github.com/clauderic/dnd-kit/issues/1511)
- [Sortable Lists - Core Concepts](https://dndkit.com/concepts/sortable/)
- [useSortable Hook - React Guide](https://dndkit.com/react/hooks/use-sortable/)
- [Managing Sortable State - React Guide](https://dndkit.com/react/guides/sortable-state-management/)
- [PointerSensor Documentation](https://docs.dndkit.com/api-documentation/sensors/pointer)
- [KeyboardSensor Documentation](https://dndkit.com/extend/sensors/keyboard-sensor/)
- [dnd-kit/sortable npm Package](https://www.npmjs.com/package/@dnd-kit/sortable)
- [React-table + dnd-kit Example (CodeSandbox)](https://codesandbox.io/s/react-table-drag-and-drop-sort-rows-with-dnd-kit-btpy9)
- [Multiple Containers Discussion - GitHub](https://github.com/clauderic/dnd-kit/discussions/821)
