---
title: "TipTap Rich Text Editor for Product Description"
description: "Replace textarea with TipTap rich text editor for product description in admin (add + edit forms), render HTML output on user product detail page"
status: completed
priority: P1
effort: 2h
branch: develop
tags: [frontend, admin, tiptap, product, rich-text]
created: 2026-05-09
---

# Plan: TipTap Product Description Editor

## Overview

Replace the plain `<textarea>` for product description with a TipTap v3 rich text editor in two admin forms, then render the resulting HTML on the user-facing product detail page.

## Goals

1. Admin can format product descriptions (bold, italic, lists, headings, links) via TipTap
2. HTML output stored in backend description field (no schema change)
3. HTML rendered correctly on user product detail page with typography styles

## Non-Goals (YAGNI)

- Image embeds in description (complex upload UX, out of scope)
- Markdown output (HTML is simpler with TipTap)
- Sanitization lib (DOMPurify) — admin-only input, not user-generated content
- Category/variant description fields (not requested)

## Pre-checks (Verified)

| Item | Status |
|------|--------|
| `@tiptap/react ^3.23.1` | ✅ installed |
| `@tiptap/starter-kit ^3.23.1` | ✅ installed |
| `@tiptap/extension-underline ^3.23.1` | ✅ installed |
| `@tiptap/extension-link ^3.23.1` | ✅ installed |
| `@tiptap/extension-placeholder ^3.23.1` | ✅ installed |
| `@tailwindcss/typography ^0.5.19` | ✅ installed, NOT configured in CSS |
| Existing TipTap component | ❌ none |

## Files

| Action | File |
|--------|------|
| **Create** | `frontend/components/admin/tiptap-editor.tsx` |
| **Modify** | `frontend/components/admin/product-info-panel.tsx` |
| **Modify** | `frontend/app/admin/(protected)/products/add/page.tsx` |
| **Modify** | `frontend/app/[locale]/(main)/product/[id]/page.tsx` |
| **Modify** | `frontend/app/globals.css` |

---

## Phase 1 — TipTap Editor Component

**File:** `frontend/components/admin/tiptap-editor.tsx`

Reusable editor used in both add and edit forms.

### Props interface

```ts
interface TiptapEditorProps {
  value: string;        // HTML string (initial content)
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}
```

### Extensions

```ts
extensions: [
  StarterKit,            // Bold, italic, headings H1-H3, lists, blockquote, code
  Underline,
  Placeholder.configure({ placeholder: placeholder ?? 'Mô tả chi tiết sản phẩm...' }),
  Link.configure({ openOnClick: false }),
]
```

### Toolbar

Minimal inline toolbar above the editor:
- **B** Bold, *I* Italic, <u>U</u> Underline
- H1, H2, H3
- Bullet list, Ordered list
- Blockquote, Code
- Link (prompt for URL on click)

Toolbar buttons use `editor.chain().focus().toggleBold().run()` pattern.
Active state: `editor.isActive('bold')` → highlight button.

### Content sync

```ts
const editor = useEditor({
  extensions,
  content: value,
  onUpdate: ({ editor }) => onChange(editor.getHTML()),
  editorProps: {
    attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2' },
  },
})

// Sync external value changes (e.g. cancel/reset)
useEffect(() => {
  if (editor && editor.getHTML() !== value) {
    editor.commands.setContent(value, false);
  }
}, [value]);
```

### Styling

Wrap in a `border border-gray-300 rounded-lg` container.
Toolbar: `flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50`.
Toolbar buttons: `px-2 py-1 text-sm rounded hover:bg-gray-200 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700`.

---

## Phase 2 — Admin Product Info Panel (Edit Form)

**File:** `frontend/components/admin/product-info-panel.tsx`

### Edit mode

Replace `<textarea>` (lines 187–194) with `<TiptapEditor>`:

```tsx
import { TiptapEditor } from '@/components/admin/tiptap-editor';

// in edit form:
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
  <TiptapEditor
    value={form.description}
    onChange={(html) => setForm((p) => ({ ...p, description: html }))}
  />
</div>
```

### View mode

Replace plain text display (lines 227–231) with HTML render:

```tsx
{product.description && (
  <div className="md:col-span-2">
    <span className="text-sm text-gray-500 block mb-1">Mô tả:</span>
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: product.description }}
    />
  </div>
)}
```

---

## Phase 3 — Admin Add Product Form

**File:** `frontend/app/admin/(protected)/products/add/page.tsx`

Replace `<textarea>` (lines 297–303) with `<TiptapEditor>`:

```tsx
import { TiptapEditor } from '@/components/admin/tiptap-editor';

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
  <TiptapEditor
    value={description}
    onChange={setDescription}
  />
</div>
```

`description` state holds HTML string — no type change needed.

---

## Phase 4 — User Product Detail Page

**File:** `frontend/app/[locale]/(main)/product/[id]/page.tsx`

The description section (currently line ~176):

```tsx
// Before:
<p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>

// After:
<div
  className="prose prose-sm max-w-none text-gray-600"
  dangerouslySetInnerHTML={{ __html: product.description }}
/>
```

Remove `whitespace-pre-line` — TipTap HTML has its own `<br>` and `<p>` tags.

---

## Phase 5 — Enable Typography Plugin

**File:** `frontend/app/globals.css`

Add after `@import "tailwindcss"`:

```css
@plugin "@tailwindcss/typography";
```

This enables `prose` classes used in display renders.

---

## Implementation Order

```
Phase 5 (CSS) → Phase 1 (component) → Phase 2 (edit panel) → Phase 3 (add form) → Phase 4 (user page)
```

Start with CSS so prose classes work immediately during dev.

## Todo

- [x] Phase 5: Add `@plugin "@tailwindcss/typography"` to globals.css
- [x] Phase 1: Create `components/admin/tiptap-editor.tsx`
- [x] Phase 2: Update `product-info-panel.tsx` (edit mode + view mode)
- [x] Phase 3: Update `products/add/page.tsx`
- [x] Phase 4: Update user product detail page
- [x] Verify TypeScript compiles without errors

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TipTap v3 API changes from v2 | Medium | `useEditor` + `EditorContent` API unchanged in v3 |
| Existing plain-text descriptions render as raw HTML | Low | Plain text without HTML tags renders fine in `dangerouslySetInnerHTML` |
| `prose` class not available | Low | Add typography plugin in Phase 5 first |
| SSR hydration mismatch | Low | TipTap renders only on client (`use client` already on both pages) |

## Security Note

`dangerouslySetInnerHTML` is safe here because:
- Source is admin-only input (not user-generated)
- No need for DOMPurify
