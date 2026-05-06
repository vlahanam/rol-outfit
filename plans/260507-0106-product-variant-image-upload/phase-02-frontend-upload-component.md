---
title: "Phase 2: Frontend – Upload API Helper + ImageUploader Component"
status: completed
priority: high
completedDate: 2026-05-07
---

# Phase 2: Frontend – Upload API Helper + ImageUploader Component

## Overview

Add an `uploads.upload()` helper to `lib/api.ts` and create a reusable `ImageUploader` component used by all 4 upload locations (product add, product edit, variant add row, variant edit).

## Related Files

- `frontend/lib/api.ts` — add `uploads` namespace
- `frontend/components/admin/image-uploader.tsx` — NEW: reusable upload component

## Step 1 – `lib/api.ts`: Add `uploads` helper

The upload endpoint uses `multipart/form-data`, not JSON — so it can't use the existing `request()` helper directly.

Add after the `adminProducts` block:

```ts
uploads: {
  async upload(file: File): Promise<string> {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);

    const headers: Record<string, string> = {
      "Accept-Language": "vi",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/uploads`, {
      method: "POST",
      headers,
      body: form,
    });

    if (!res.ok) {
      const body: ApiErrorBody = await res
        .json()
        .catch(() => ({ error: "Upload failed" }));
      throw new ApiError(
        res.status,
        body.reason ?? body.error ?? "Upload failed",
      );
    }

    const data: { url: string } = await res.json();
    return data.url;
  },

  delete(filename: string): Promise<void> {
    return request<void>(`/uploads/${filename}`, { method: "DELETE" });
  },
},
```

Note: `getToken()` and `ApiError` are already defined in `lib/api.ts` — reuse them.

## Step 2 – `components/admin/image-uploader.tsx`

### Props interface

```ts
type Props = {
  value: string;           // current image URL (empty string = no image)
  onChange: (url: string) => void;  // called with new URL after upload, or "" on remove
  required?: boolean;      // show required indicator, prevent remove if true
  label?: string;          // section label, defaults to "Ảnh"
  error?: string;          // validation error message from parent
};
```

### Behaviour

1. **Display**: If `value` is non-empty, show `<Image>` preview (80×80px square, `object-cover`). Otherwise show a gray placeholder with `<ImageIcon>`.
2. **Upload**: Clicking the preview or the upload button opens a hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">`. On file select:
   - Set `uploading = true`
   - Call `api.uploads.upload(file)` → get new URL
   - If there was an old URL, call `api.uploads.delete(filenameFromUrl(oldUrl))` (best-effort, swallow errors)
   - Call `onChange(newUrl)`
   - Set `uploading = false`
3. **Remove**: If `!required` and `value` is non-empty, show a small × button. On click:
   - Call `api.uploads.delete(filenameFromUrl(value))` (best-effort)
   - Call `onChange("")`
4. **Error state**: If `error` prop is set, show red border on container + error text below.
5. **Uploading state**: Show a spinner overlay on the preview box while uploading.

### Helper

```ts
function filenameFromUrl(url: string): string {
  // "/uploads/abc-123.jpg" → "abc-123.jpg"
  return url.split("/").pop() ?? url;
}
```

### Component skeleton

```tsx
export function ImageUploader({ value, onChange, required, label = "Ảnh", error }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected
    setUploading(true);
    setUploadError(null);
    try {
      const newUrl = await api.uploads.upload(file);
      if (value) {
        api.uploads.delete(filenameFromUrl(value)).catch(() => {});
      }
      onChange(newUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (value) {
      api.uploads.delete(filenameFromUrl(value)).catch(() => {});
    }
    onChange("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative w-20 h-20 rounded-lg border-2 ${
          error ? "border-red-500" : "border-gray-300"
        } border-dashed overflow-hidden cursor-pointer hover:border-blue-400 transition-colors`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {value ? (
          <Image src={value} alt={label} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          disabled={uploading}
        >
          {value ? "Thay ảnh" : "Chọn ảnh"}
        </button>
        {!required && value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Xóa
          </button>
        )}
      </div>
      {(error || uploadError) && (
        <p className="mt-1 text-xs text-red-600">{uploadError ?? error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
```

## Notes

- `Image` from `next/image` requires `fill` prop + positioned parent for the overlay pattern — ensure parent has `position: relative` (Tailwind `relative` class).
- `filenameFromUrl` only works because filenames are UUIDs with no path separators — safe by convention.
- Best-effort delete: old file deletion failure should NOT block the new upload from completing.
- Keep file under 100 lines — it's a leaf component with no sub-children.

## Todo

- [ ] Add `uploads.upload()` and `uploads.delete()` to `lib/api.ts`
- [ ] Create `components/admin/image-uploader.tsx` with `ImageUploader` component
- [ ] `filenameFromUrl` helper in same file
- [ ] TypeScript check: `npx tsc --noEmit`
