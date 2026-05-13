# Code Review: Admin Widget Management

**Date:** 2026-05-10
**Branch:** develop
**Scope:** Backend (widget_repo, widget_service, widget_controller, route.go) + Frontend (types/api.ts, api-resources.ts, api.ts, validations.ts, AdminSidebar.tsx, widgets pages)

---

## Overall Assessment

Implementation is functional and consistent with existing category/tag patterns. Auth is correctly wired. Two bugs need fixing before shipping: a double DB fetch in `Create` that can produce wrong depth values, and a parent-reparenting UX that silently does nothing. Several medium issues are noted below.

---

## Critical Issues

None.

---

## High Priority

### 1. Double parent DB fetch in `Create` can yield wrong depth (widget_service.go:65-82)

The service calls `FindWidgetByID` twice for the same parent UUID — once to validate existence, then again to get depth. These are two separate SQL round-trips. Worse: the first call checks `status = ACTIVE`, so if the parent exists but is hidden, the first call returns `nil` and `ErrWidgetNotFound` is returned to the caller. This means **an admin cannot create a child widget under a hidden container**. The second fetch on line 78 also uses the public (status-filtered) lookup, so its error is silently swallowed (`_`).

**Fix:** Replace both calls with a single `FindWidgetByIDAdmin` call, store the result, and use it for both nil-check and depth calculation.

```go
func (s *widgetService) Create(ctx context.Context, req *requests.CreateWidgetRequest) (*models.Widget, error) {
    depth := 0
    if req.ParentID != nil {
        parent, err := s.repo.FindWidgetByIDAdmin(ctx, *req.ParentID)
        if err != nil {
            return nil, fmt.Errorf("failed to check parent widget: %w", err)
        }
        if parent == nil {
            return nil, ErrWidgetNotFound
        }
        depth = parent.Depth + 1
    }
    // ... rest unchanged
}
```

### 2. Edit form sends parent_id to schema validation but Update service ignores it (silent data loss)

`editWidgetSchema` (derived via `.partial()` from `addWidgetSchema`) includes `parent_id`. The edit page validates it and even shows a parent selector dropdown. However:
- `UpdateWidgetPayload` (frontend type) has no `parent_id` field.
- The edit page's `handleSubmit` passes `parent_id` into schema parse but does **not** include it in the `api.adminWidgets.update(id, {...})` call body.
- The backend `UpdateWidgetRequest` has a `ParentID` field declared but the `Update` service method never populates `fields["parent_id"]`.

Result: a user can change the parent dropdown, click save, see success, but the widget's parent is never updated. This is a silent no-op that will confuse admins.

**Resolution options:**
- **Option A (simplest):** Remove the parent selector from the edit form entirely since reparenting is not implemented. The spec says depth=0/1 so reparenting may be intentionally unsupported.
- **Option B:** Implement reparenting fully — add `parent_id` to `UpdateWidgetRequest` handling in the service (with depth recalculation) and `UpdateWidgetPayload` in frontend.

---

## Medium Priority

### 3. React Fragment missing `key` in list page (widgets/page.tsx:204-209)

The outer map over `filteredRoots` wraps each row group in `<>...</>` (React.Fragment shorthand), which cannot take a `key` prop. This causes React to emit "Each child in a list should have a unique `key`" warnings and may cause rendering glitches when the list re-orders.

**Fix:** Replace `<>` with `<React.Fragment key={w.id}>`.

```tsx
{filteredRoots.map((w) => (
  <React.Fragment key={w.id}>
    {renderRow(w)}
    {expanded[w.id] && (children[w.id] ?? []).map((child) => renderRow(child, true))}
  </React.Fragment>
))}
```

Note: `renderRow` already sets `key={w.id}` on the `<tr>`, but React's reconciliation still needs the Fragment key for the outer wrapper.

### 4. Deleting a root container does not clean up its loaded children state

In `handleDelete`, when `deleteTarget.parent_id` is null (root widget), the code removes it from `roots` but leaves its entry in both `children` (the cached children array) and `expanded` (the open/closed map). The DB cascade deletes the children, but if the root is re-created with the same ID (unlikely but possible), stale child state would be shown. More practically, the `children` map and `expanded` map grow unboundedly — they are never cleaned up after deletion.

**Fix:** In `handleDelete`, also remove `children[deleteTarget.id]` and `expanded[deleteTarget.id]`.

```ts
setChildren((prev) => {
  const next = { ...prev };
  delete next[deleteTarget.id]; // clean up own children cache
  if (deleteTarget.parent_id && next[deleteTarget.parent_id]) {
    next[deleteTarget.parent_id] = next[deleteTarget.parent_id].filter(
      (w) => w.id !== deleteTarget.id,
    );
  }
  return next;
});
setExpanded((prev) => {
  const next = { ...prev };
  delete next[deleteTarget.id];
  return next;
});
```

### 5. Image widget `url_image` / `link` fields have no URL validation

Both the add and edit forms accept free-text for `url_image` and `link`. There is also no backend validation for the shape of `settings` — the `CreateWidgetRequest.Validate()` and `UpdateWidgetRequest.Validate()` do not inspect `Settings` content at all. A user could submit malformed JSON or XSS payloads into these fields.

Since `settings` is stored as `jsonb` and is rendered only in a frontend that you control, XSS risk is low in the current scope. However:
- Add frontend validation: `z.string().url()` for `url_image` and `link` when type is `image`.
- Add backend validation: when `Type == "image"` and `Settings` is non-null, check that both `url_image` and `link` are present and are valid URLs.

### 6. Hard-coded `limit: 100` throughout

The add/edit pages and the list page all hard-code `limit: 100` when fetching containers or root widgets. This is fine for now but creates a hidden cap: if there are more than 100 root widgets or containers, the dropdown and table will silently truncate. This should at minimum be a named constant or TODO comment.

---

## Low Priority

### 7. Sidebar active state uses exact match — sub-routes won't highlight

`AdminSidebar.tsx` uses `pathname === path` for active state. Navigating to `/admin/widgets/add` or `/admin/widgets/:id/edit` will not highlight the "Widgets" menu item. This is pre-existing behavior shared with all other menu items (categories, tags all have the same issue). Worth a followup but not introduced by this PR.

### 8. `depth` field not enforced at application level beyond 1

The DB schema allows unlimited nesting via `parent_id` self-reference. The frontend only shows depth-0 containers as parents (correct), but the backend API does not enforce `depth <= 1`. A direct API call could create depth-2 widgets. If the product spec mandates max depth=1, add a guard in `Create`:

```go
if depth > 1 {
    return nil, errors.New("widget nesting exceeds maximum depth")
}
```

---

## Positive Observations

- Auth is correctly applied: all write/delete routes are behind `JWTAuth + RequireRole(ADMIN)`. The new `GET /admin/widgets` routes follow the exact same pattern as `/admin/categories` and `/admin/tags`.
- `FindWidgetByIDAdmin` correctly omits the status filter, fixing the pre-existing bug where `Update` and `Delete` would fail on hidden widgets.
- `ON DELETE CASCADE` on `parent_id` in the migration means DB-level cleanup is handled correctly when a container is deleted.
- The composite index `idx_widgets_parent_order ON widgets(parent_id, display_order)` covers both the `parent_id` filter and the `ORDER BY display_order` in `ListWidgets` — good.
- Error handling in all new controllers is consistent: 400/404/500 with i18n messages, same as categories/tags.
- Frontend zod validation uses `z.coerce.number()` for `display_order` and `status`, correctly handling string-to-number coercion from form inputs.
- `editWidgetSchema = addWidgetSchema.partial()` is a clean DRY approach.

---

## Required Actions (Blocking)

1. Fix double parent fetch in `Create` to use `FindWidgetByIDAdmin` (bug: hidden parent blocks child creation; N+1 round-trip).
2. Either remove the parent selector from the edit form or implement reparenting end-to-end. The current state silently drops the user's input.

## Recommended Actions (Non-blocking)

3. Add `key` prop to `React.Fragment` in list page (React warning).
4. Clean up `children` and `expanded` state on delete.
5. Add `z.string().url()` validation for image settings fields.
6. Extract `100` limit to a named constant.
7. Optionally guard `depth > 1` at service level if spec mandates it.

---

## Unresolved Questions

- Is reparenting (moving a widget to a different container) an intended feature? The edit form UI implies yes, but the backend ignores it.
- Is the max widget hierarchy depth 1 (root + one level) or deeper? The DB supports arbitrary depth but the frontend only shows depth=0 containers as parents.
