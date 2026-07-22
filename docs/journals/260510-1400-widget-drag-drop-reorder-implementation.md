# Widget Drag-and-Drop Reorder Implementation

**Date**: 2026-05-10 14:00
**Severity**: Medium
**Component**: Admin Homepage Widgets UI
**Status**: Resolved

## What Happened

Successfully implemented drag-and-drop reordering for admin homepage widgets with full DnD Kit integration. Feature allows drag handlers on nested expandable widget rows (parent widgets with children), commits reorder to backend via PUT endpoint with rollback support.

## The Brutal Truth

This was deceptively straightforward implementation that nearly shipped with three show-stopping bugs. Code review caught silent failures, race conditions, and stale closures that would have made the feature unreliable in production. The real work wasn't building the feature — it was preventing disaster.

## Technical Details

**Created component:**
- `frontend/components/admin/widgets/widget-sortable-row.tsx` — Wrapped row in `useSortable()` hook with GripVertical icon as drag handle only (prevents accidental drags on other row content)

**Modified component:**
- `frontend/app/admin/(protected)/widgets/page.tsx` — Integrated DndContext at table level, nested SortableContext (outer for root rows, inner for expanded children), added PointerSensor with `distance: 8` activation constraint to reduce friction

**Critical bugs fixed during review:**

1. **Search-active drag corruption** — `handleDragEnd` would reorder even with active search filter, corrupting filtered view. Added guard: `if (search) return` before state mutation.

2. **Silent API failures** — `updateDisplayOrders` PUT request failures never surfaced to user. Fixed by wrapping in try-catch, setting `isSaving` ref as flag, displaying error toast, rolling back with `fetchRoots()` + `setChildren({})` + `loadedParents.current.clear()`.

3. **Stale closure in `loadChildren`** — Function captured old `children` state in closure, causing race conditions when loading while dragging. Replaced state dependency with `useRef<Set<string>>` tracking loaded parent IDs — `loadChildren` now stable with `[]` deps.

4. **Concurrent drag guard** — No protection against user submitting multiple drags before first PUT completes. Added `isSaving.current` check in `handleDragEnd` to prevent overlapping batches.

## What We Tried

1. Initial implementation used inline drag handlers on row — shifted to scoped GripVertical icon only after realizing accidental drags on row text.
2. First version didn't track loaded parents — led to N+1 child fetches on re-expand. Switched to `useRef Set` tracking.
3. Error handling was missing entirely — added full toast + rollback path after review caught it.

## Root Cause Analysis

The bugs weren't architectural failures — they were oversight patterns:

- **Search guard missing**: Feature spec didn't explicitly mention disable-during-filter behavior, but logically required. Should have added during spec review.
- **Error handling forgotten**: Async operations without surface feedback assumed success path. Every async mutation should default to showing errors.
- **Closure captured state**: Common React footgun with nested useEffect dependencies. The `loadedParents` useRef pattern should be standard for tracking loaded state in nested components.
- **Race condition unguarded**: No assumption of "user won't drag twice" — backend can't guarantee order if concurrent PUTs arrive out-of-order.

## Lessons Learned

1. **Async mutations require explicit error surfaces** — If user can't see errors, errors don't exist to the app. Toast, modal, or inline feedback is mandatory.

2. **Stale closures in nested data loading** — When child components load async, track loaded state via `useRef` not state to avoid capturing stale values. State changes trigger re-renders; ref changes don't.

3. **Filter + mutation = guard clause** — Any mutation that affects sorted/filtered lists needs a defensive check: "if filtering, do nothing and warn user." The two shouldn't interact.

4. **Race conditions are free to prevent** — A single `isSaving.current` check costs nothing and eliminates a class of bugs. Always guard overlapping async operations.

5. **Code review caught what tests couldn't** — Unit tests pass happy paths. Review catches "what if the user..." scenarios. Both are necessary.

## Next Steps

1. **Add integration tests for search + drag**: Verify that attempting drag while search active shows error toast and prevents mutation.
2. **Document loadedParents pattern**: Add comment to `widget-sortable-row.tsx` explaining why useRef Set is used for tracking loaded children (prevents stale closures in `loadChildren`).
3. **Monitor backend for orphaned display_order updates**: Ensure no widgets land in inconsistent order states during concurrent mutations (likely won't happen with guard, but log it anyway).
4. **Consider debouncing reorder API**: Current PUT fires immediately on drop. If this becomes problematic at scale, batch multiple reorders into single request.

**Commit**: `66a2b46` on develop branch
**Test status**: Manual testing only — recommend adding E2E for drag+drop scenarios
