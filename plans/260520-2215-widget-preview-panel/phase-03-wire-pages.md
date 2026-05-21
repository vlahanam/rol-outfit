---
phase: 3
title: Wire Components into Add/Edit Pages
status: completed
priority: high
effort: 30min
blockedBy: [phase-01, phase-02]
---

# Phase 03 – Wire into Add/Edit Pages

## Overview

Update `add/page.tsx` and `edit/page.tsx` to:
1. Add `metadata` state initialized from `DEFAULT_WIDGET_METADATA[type]`
2. Reset metadata when type changes
3. Render `WidgetMetadataForm` (left panel) + `WidgetTypePreview` (right panel)
4. Include `metadata` in create/update API payload
5. Change page layout from `max-w-2xl` single column to 2-column split

## Related Code Files

**Modify:**
- `frontend/app/admin/(protected)/widgets/add/page.tsx`
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx`

## Layout Change

Current layout wrapper: `<div className="space-y-6 max-w-2xl">`

New layout — 2-column split:
```tsx
<div className="space-y-6">
  {/* header row (full width) */}
  <div className="flex items-center gap-4">...</div>

  {/* 2-column body */}
  <div className="flex gap-6 items-start">
    {/* LEFT: form card */}
    <div className="flex-1 min-w-0">
      <form ...>
        {/* existing fields: name, type, status */}
        {/* NEW: metadata form section */}
        <div className="border-t pt-4 mt-2">
          <WidgetMetadataForm
            type={form.type}
            metadata={metadata}
            onChange={setMetadata}
          />
        </div>
        {/* action buttons */}
      </form>
    </div>

    {/* RIGHT: live preview panel */}
    <div className="w-[480px] flex-shrink-0 sticky top-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
          Xem trước
        </p>
        <WidgetTypePreview
          type={form.type}
          name={form.name}
          metadata={metadata}
        />
      </div>
    </div>
  </div>
</div>
```

## State Changes for add/page.tsx

```typescript
// Add metadata state (initialized to default for banner-slider)
const [metadata, setMetadata] = useState<WidgetMetadata>(
  DEFAULT_WIDGET_METADATA["banner-slider"]
);

// When type changes, reset metadata to default for new type
const handleTypeChange = (newType: WidgetType) => {
  setForm((p) => ({ ...p, type: newType }));
  setMetadata(DEFAULT_WIDGET_METADATA[newType]);
};
```

Replace the type `<select onChange>` handler:
```tsx
// Before:
onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as WidgetType }))}

// After:
onChange={(e) => handleTypeChange(e.target.value as WidgetType)}
```

Include metadata in submit payload:
```typescript
await api.adminWidgets.create({
  name: result.data.name,
  type: result.data.type,
  status: result.data.status,
  metadata,  // add this
});
```

## State Changes for edit/page.tsx

```typescript
// Add metadata state
const [metadata, setMetadata] = useState<WidgetMetadata>(
  DEFAULT_WIDGET_METADATA["banner-slider"]
);

// In useEffect, populate metadata from fetched widget
useEffect(() => {
  api.adminWidgets.get(id).then((res) => {
    const w = res.data;
    setForm({ name: w.name, type: w.type, status: w.status });
    // Load saved metadata or fall back to default for the type
    setMetadata(
      (w.metadata as WidgetMetadata) ?? DEFAULT_WIDGET_METADATA[w.type]
    );
  })
  .catch(...)
  .finally(...);
}, [id]);

// Type change handler (same as add page)
const handleTypeChange = (newType: WidgetType) => {
  setForm((p) => ({ ...p, type: newType }));
  setMetadata(DEFAULT_WIDGET_METADATA[newType]);
};
```

Include metadata in update payload:
```typescript
await api.adminWidgets.update(id, {
  name: result.data.name,
  type: result.data.type,
  status: result.data.status,
  metadata,  // add this
});
```

## Todo List

- [x] `add/page.tsx`: add `metadata` state + `handleTypeChange`
- [x] `add/page.tsx`: update type select `onChange` to use `handleTypeChange`
- [x] `add/page.tsx`: include `metadata` in `api.adminWidgets.create()` call
- [x] `add/page.tsx`: add `WidgetMetadataForm` inside form, below status row
- [x] `add/page.tsx`: change layout to 2-column, add `WidgetTypePreview` in right panel
- [x] `edit/page.tsx`: add `metadata` state + populate from fetched widget in `useEffect`
- [x] `edit/page.tsx`: update type select `onChange` to use `handleTypeChange`
- [x] `edit/page.tsx`: include `metadata` in `api.adminWidgets.update()` call
- [x] `edit/page.tsx`: add `WidgetMetadataForm` inside form, below status row
- [x] `edit/page.tsx`: change layout to 2-column, add `WidgetTypePreview` in right panel
- [x] `npx tsc --noEmit` exits 0
- [x] Verify in browser: preview updates live as type changes and as images upload

## Success Criteria

- Selecting a different type resets metadata form and swaps preview layout
- Typing widget name updates the preview heading in real-time
- Uploading an image instantly appears in the preview
- Saved widget metadata round-trips correctly (edit page loads existing images)
- No TypeScript errors

## Risk Assessment

- **Low** — pure wiring; both pages have identical patterns so changes are symmetric
- Watch for: `w.metadata` cast — backend returns `null` for existing widgets (no metadata yet), fallback to `DEFAULT_WIDGET_METADATA[w.type]` handles this
