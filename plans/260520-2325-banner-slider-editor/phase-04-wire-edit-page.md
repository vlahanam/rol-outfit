---
phase: 4
title: Wire into Edit Page
status: completed
effort: 20 min
---

# Phase 4 – Wire into Edit Page

## Context Links
- `frontend/app/admin/(protected)/widgets/[id]/edit/page.tsx` — current edit page
- `frontend/components/admin/widgets/banner-slider-editor.tsx` — Phase 2
- `frontend/components/admin/widgets/banner-slider-preview.tsx` — Phase 3
- `frontend/types/api.ts` — `BannerSlide`, `BannerSliderMetadata`

## Overview

Cập nhật edit page để:
1. Load `metadata.slides` từ API khi widget có type `banner-slider`
2. Render `BannerSliderPreview` + `BannerSliderEditor` bên dưới form cơ bản
3. Save metadata cùng với name/status khi submit

## Implementation Steps

### 1. State additions

```typescript
const [slides, setSlides] = useState<BannerSlide[]>([]);
const [activeSlide, setActiveSlide] = useState(0);
```

### 2. Load metadata on fetch (inside existing `useEffect`)

```typescript
api.adminWidgets.get(id).then((res) => {
  const w = res.data;
  setForm({ name: w.name, type: w.type as WidgetType, status: w.status });
  // Load banner slides if applicable
  if (w.type === "banner-slider" && w.metadata) {
    const meta = w.metadata as { slides?: BannerSlide[] };
    if (Array.isArray(meta.slides) && meta.slides.length > 0) {
      setSlides(meta.slides);
    } else {
      setSlides([DEFAULT_SLIDE()]);
    }
  }
});
```

Add `DEFAULT_SLIDE` helper at module level:
```typescript
const DEFAULT_SLIDE = (): BannerSlide => ({
  id: crypto.randomUUID(),
  image: "", label: "", title: "", description: "", cta_text: "", cta_link: "",
});
```

### 3. Save metadata on submit (inside `handleSubmit`)

```typescript
const payload: UpdateWidgetPayload = { name: form.name, status: form.status };
if (form.type === "banner-slider") {
  payload.metadata = { slides };
}
await api.adminWidgets.update(id, payload);
```

### 4. Render banner-slider section (below the `<form>`)

```tsx
{form.type === "banner-slider" && !loading && (
  <div className="space-y-6">
    <BannerSliderPreview
      slides={slides}
      activeIndex={activeSlide}
      onActiveChange={setActiveSlide}
    />
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-gray-700">Nội Dung Slides</h2>
      <BannerSliderEditor
        slides={slides}
        onChange={setSlides}
        activeIndex={activeSlide}
        onActiveChange={setActiveSlide}
      />
    </div>
  </div>
)}
```

### 5. Imports to add

```typescript
import { BannerSliderEditor } from "@/components/admin/widgets/banner-slider-editor";
import { BannerSliderPreview } from "@/components/admin/widgets/banner-slider-preview";
import type { BannerSlide } from "@/types/api";
```

## Layout Result

```
[← Back]  Chỉnh Sửa Widget
[Error banner if any]

[Form: name + type(readonly) + status + Save button]   ← max-w-2xl

[Preview: 16:6 hero banner live preview]               ← full-width

[Slides editor card]                                   ← max-w-2xl
  Slide 1 | Slide 2 | + Thêm Slide
  [Image upload]
  Label / Title / Description / CTA text / CTA link
  [Xóa slide này]
```

## Todo List

- [x] Add `slides` + `activeSlide` state
- [x] Parse `metadata.slides` in `useEffect` on fetch
- [x] Add `defaultSlide()` helper (exported from editor component for reuse)
- [x] Include `metadata` in update payload when type is `banner-slider`
- [x] Render `BannerSliderPreview` + `BannerSliderEditor` conditionally
- [x] Add imports
- [x] Safe metadata cast with spread over `defaultSlide()` fields (handles older data)
- [x] Image validation before submit (focuses offending slide on error)

## Success Criteria

- Edit page loads existing slides from `metadata` on mount
- Realtime preview updates as user edits text/images
- Saving calls `PUT /widgets/:id` with `{ name, status, metadata: { slides } }`
- Non-banner-slider widgets unchanged
- TypeScript compiles without errors
