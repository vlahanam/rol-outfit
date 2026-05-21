---
phase: 2
title: Frontend – New Widget Components
status: completed
priority: high
effort: 90min
blockedBy: [phase-01]
---

# Phase 02 – Frontend: New Components

## Overview

Create two new components and update TypeScript types:
1. `widget-metadata-form.tsx` — type-specific form fields with image upload slots
2. `widget-type-preview.tsx` — live preview renderer for all 5 widget types

Both share the same `metadata` state object passed down from the page.

## Related Code Files

**Modify:**
- `frontend/types/api.ts`

**Create:**
- `frontend/components/admin/widgets/widget-metadata-form.tsx`
- `frontend/components/admin/widgets/widget-type-preview.tsx`

## Key Reuse

- `ImageUploader` at `frontend/components/admin/image-uploader.tsx` — already handles upload + thumbnail + delete. Reuse for every image slot.

## TypeScript Metadata Types

Define in `frontend/types/api.ts` (add after existing Widget types):

```typescript
export interface WidgetSlide {
  image_url: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
}

export interface WidgetImageItem {
  image_url: string;
  title: string;
  description: string;
  link: string;
}

export type WidgetMetadata =
  | { slides: WidgetSlide[] }                              // banner-slider
  | { images: WidgetImageItem[] }                          // image-scroll-list, two-large-images, one-large-two-small
  | { slides: Omit<WidgetSlide, 'button_link'>[]; image: WidgetImageItem }; // slider-and-large-image
```

Also add `metadata` to `Widget`, `CreateWidgetPayload`, `UpdateWidgetPayload`:
```typescript
// Widget interface
metadata: WidgetMetadata | null;

// CreateWidgetPayload
metadata?: WidgetMetadata | null;

// UpdateWidgetPayload
metadata?: WidgetMetadata | null;
```

## Default metadata per type

```typescript
// Used to initialize metadata when type changes
export const DEFAULT_WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  "banner-slider": {
    slides: [{ image_url: "", title: "", description: "", button_text: "", button_link: "" }],
  },
  "image-scroll-list": {
    images: [
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
    ],
  },
  "two-large-images": {
    images: [
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
    ],
  },
  "one-large-two-small": {
    images: [
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
      { image_url: "", title: "", description: "", link: "" },
    ],
  },
  "slider-and-large-image": {
    slides: [{ image_url: "", title: "", description: "", button_text: "" }],
    image: { image_url: "", title: "", description: "", link: "" },
  },
};
```

Place `DEFAULT_WIDGET_METADATA` in `frontend/types/api.ts` (exported constant).

## Component: widget-metadata-form.tsx

**Props:**
```typescript
type Props = {
  type: WidgetType;
  metadata: WidgetMetadata;
  onChange: (metadata: WidgetMetadata) => void;
};
```

**Sub-sections per type (all in one file, under 200 lines):**

### BannerSliderForm
- Renders each slide in `metadata.slides[]` with:
  - `ImageUploader` for `image_url`
  - Text inputs: `title`, `description`, `button_text`, `button_link`
- "Thêm slide" button → appends blank slide
- "Xóa" button per slide (min 1 slide enforced)

### ImageScrollListForm
- Renders each item in `metadata.images[]` with:
  - `ImageUploader` for `image_url`
  - Text inputs: `title`, `description`, `link`
- "Thêm ảnh" button → appends blank item
- "Xóa" button per item (min 1 enforced)

### TwoLargeImagesForm
- Fixed 2 items — no add/remove
- Each: `ImageUploader` + `title`, `description`, `link`
- Labels: "Ảnh 1", "Ảnh 2"

### OneLargeTwoSmallForm
- Fixed 3 items — no add/remove
- Item [0]: labeled "Ảnh lớn"
- Items [1][2]: labeled "Ảnh nhỏ 1", "Ảnh nhỏ 2"
- Each: `ImageUploader` + `title`, `description`, `link`

### SliderAndLargeImageForm
- `slides[]` section (same as BannerSliderForm but no `button_link` field)
- `image` section (fixed 1 item): `ImageUploader` + `title`, `description`, `link`

**File structure:**
```
widget-metadata-form.tsx
├── helper: updateSlide(slides, index, field, value) → slides[]
├── helper: updateImage(images, index, field, value) → images[]
├── BannerSliderForm (internal component)
├── ImageScrollListForm (internal component)
├── TwoLargeImagesForm (internal component)
├── OneLargeTwoSmallForm (internal component)
├── SliderAndLargeImageForm (internal component)
└── export WidgetMetadataForm (switch on type → render correct sub-form)
```

> If file exceeds 200 lines, split sub-forms into separate files under `widgets/metadata-forms/`.

## Component: widget-type-preview.tsx

**Props:**
```typescript
type Props = {
  type: WidgetType;
  name: string;
  metadata: WidgetMetadata;
};
```

**Preview rendering per type:**

All previews use a dark background (`bg-gray-900`) for the widget area to match the reference designs.

### BannerSliderPreview
- Full-width dark box
- Shows `slides[0]` (first slide only as preview)
- Renders: image (if `image_url` set, else black box), `title`, `description`, `button_text` as outlined button
- Bottom dots indicator for number of slides

### ImageScrollListPreview
- 4-column flex row, `overflow-x-auto` if `images.length > 4`
- Each column: dark box with `image_url` (if set), `title`, `description`, `link` text
- Fixed column width `min-w-[130px]`

### TwoLargeImagesPreview
- 2-column equal grid
- Each: dark box with image, `title`, `description`, `link`

### OneLargeTwoSmallPreview
- 2-column grid: left 60%, right 40%
- Left: single large dark box (images[0])
- Right: 2 stacked small dark boxes (images[1], images[2])

### SliderAndLargeImagePreview
- 2-column equal grid
- Left: slide box with title/desc/button (slides[0])
- Right: image box with title/desc/link

**Image rendering rule:** If `image_url` is set → render with `<img>` (`object-cover`). If empty → render solid `bg-gray-800` placeholder box.

**Widget name** rendered as heading above the preview area.

**File structure:**
```
widget-type-preview.tsx
├── ImageBox (internal): renders image or dark placeholder
├── BannerSliderPreview (internal)
├── ImageScrollListPreview (internal)
├── TwoLargeImagesPreview (internal)
├── OneLargeTwoSmallPreview (internal)
├── SliderAndLargeImagePreview (internal)
└── export WidgetTypePreview (switch on type → render correct preview)
```

> If file exceeds 200 lines, split into `widget-previews/` subfolder.

## Todo List

- [x] Add `WidgetSlide`, `WidgetImageItem`, `WidgetMetadata` types to `api.ts`
- [x] Add `metadata` to `Widget`, `CreateWidgetPayload`, `UpdateWidgetPayload` in `api.ts`
- [x] Export `DEFAULT_WIDGET_METADATA` constant from `api.ts`
- [x] Create `widget-metadata-form.tsx` with all 5 sub-forms
- [x] Create `widget-type-preview.tsx` with all 5 preview renderers
- [x] Verify `ImageUploader` is correctly imported and reused (not re-implemented)
- [x] Verify both files compile: `cd frontend && npx tsc --noEmit`

## Success Criteria

- `npx tsc --noEmit` exits 0
- `WidgetMetadataForm` renders correct sub-form for each type
- `WidgetTypePreview` renders correct layout for each type
- Uploading an image in `widget-metadata-form` immediately updates preview
- No components exceed 200 lines (split if needed)

## Risk Assessment

- **Medium** — ImageUploader already handles uploads; main risk is Tailwind layout complexity for `one-large-two-small` and `slider-and-large-image` grids. Test all 5 type previews visually.
