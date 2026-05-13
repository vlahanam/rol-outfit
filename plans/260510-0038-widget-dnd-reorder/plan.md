---
title: Widget Drag-and-Drop Reorder
status: complete
priority: medium
blockedBy: []
blocks: []
---

# Widget DnD Reorder

## Context
Admin widget list page needs drag-and-drop reordering so admins can visually reorder homepage widgets without manually editing `display_order` numbers. All three @dnd-kit packages are already installed.

## Scope
- **IN**: Reorder root containers among themselves
- **IN**: Reorder children within their parent container  
- **OUT**: Cross-container drag (child → different parent)
- **OUT**: Backend changes (existing `PUT /widgets/:id` is sufficient)

## Phases

| Phase | File(s) | Status |
|-------|---------|--------|
| [Phase 1](./phase-01-sortable-row-component.md) | Create `components/admin/widgets/widget-sortable-row.tsx` | ✓ Complete |
| [Phase 2](./phase-02-integrate-dnd-page.md) | Refactor `app/admin/(protected)/widgets/page.tsx` | ✓ Complete |

## Key Dependencies
- `@dnd-kit/core@6.3.1` ✓ installed
- `@dnd-kit/sortable@10.0.0` ✓ installed  
- `@dnd-kit/utilities@3.2.2` ✓ installed
- Backend `PUT /widgets/:id` accepts `{ display_order: number }` ✓

## Verification
1. `npx tsc --noEmit` passes
2. Drag root container → order persists on refresh
3. Expand container, drag child → order updates within container
4. Network tab shows PUT calls on drag end
5. API failure → original order auto-restores
