# Phase 4: TipTap Image Upload

## Context Links
- TipTap editor: `/frontend/components/admin/tiptap-editor.tsx`
- Image uploader: `/frontend/components/admin/image-uploader.tsx`
- Upload API: `/frontend/lib/api-resources.ts` (`uploads.upload`)
- Backend upload service: `/backend/src/internal/services/upload_service.go`
- Upload endpoint: `POST /api/v1/uploads`

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2 hours

Add image insertion capability to TipTap rich text editor for product descriptions.

## Key Insights
- TipTap has official `@tiptap/extension-image` package
- Upload service already exists and works (used by `ImageUploader` component)
- Need to add toolbar button and handle file selection + upload
- Images stored as `<img src="...">` in HTML content

## Requirements

### Functional
- Add image button to TipTap toolbar
- Click opens file picker
- Selected image uploads to server
- Image inserted at cursor position
- Support resize/alignment (optional, phase 2)

### Non-Functional
- Max file size: 10MB (match existing uploader)
- Allowed types: jpeg, png, webp, gif
- Show upload progress indicator

## Architecture

**Data Flow:**
```
User clicks image button
  -> File picker opens
  -> User selects image
  -> Upload to POST /api/v1/uploads
  -> Receive URL in response
  -> Insert <img src="URL"> at cursor
  -> HTML saved with product description
```

## Related Code Files

### Files to Modify
- `frontend/components/admin/tiptap-editor.tsx`

### Files to Read (Context)
- `frontend/components/admin/image-uploader.tsx` (upload pattern)
- `frontend/lib/api-resources.ts` (uploads API)

### Dependencies to Install
```bash
npm install @tiptap/extension-image
```

## Implementation Steps

1. **Install TipTap Image extension**:
   ```bash
   cd frontend && npm install @tiptap/extension-image
   ```

2. **Update TipTap editor imports**:
   ```typescript
   import Image from "@tiptap/extension-image";
   import { ImageIcon, Loader2 } from "lucide-react";
   import { uploads } from "@/lib/api-resources";
   ```

3. **Add Image extension to editor config**:
   ```typescript
   const editor = useEditor({
     extensions: [
       StarterKit,
       Underline,
       Placeholder.configure({
         placeholder: placeholder ?? "Mo ta chi tiet san pham...",
       }),
       Link.configure({ openOnClick: false }),
       Image.configure({
         inline: false,
         allowBase64: false,
         HTMLAttributes: {
           class: "max-w-full h-auto rounded-lg",
         },
       }),
     ],
     // ... rest unchanged
   });
   ```

4. **Add upload state and handler**:
   ```typescript
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !editor) return;
     e.target.value = ""; // Reset input
     
     // Validate file
     if (file.size > 10 * 1024 * 1024) {
       alert("Anh khong duoc vuot qua 10 MB");
       return;
     }
     
     const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
     if (!allowedTypes.includes(file.type)) {
       alert("Chi chap nhan file JPEG, PNG, WebP hoac GIF");
       return;
     }
     
     setUploading(true);
     try {
       const url = await uploads.upload(file);
       editor.chain().focus().setImage({ src: url }).run();
     } catch (err) {
       alert(err instanceof Error ? err.message : "Upload that bai");
     } finally {
       setUploading(false);
     }
   };
   ```

5. **Add image button to toolbar** (after Link button):
   ```typescript
   <span className="w-px h-6 bg-gray-300 mx-1 self-center" />
   
   <ToolbarButton
     onClick={() => fileInputRef.current?.click()}
     active={false}
     title="Insert image"
     disabled={uploading}
   >
     {uploading ? (
       <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
       <ImageIcon className="w-4 h-4" />
     )}
   </ToolbarButton>
   
   <input
     ref={fileInputRef}
     type="file"
     accept="image/jpeg,image/png,image/webp,image/gif"
     className="hidden"
     onChange={handleImageUpload}
   />
   ```

6. **Update ToolbarButton to support disabled state**:
   ```typescript
   function ToolbarButton({
     onClick,
     active,
     title,
     children,
     disabled,
   }: {
     onClick: () => void;
     active?: boolean;
     title: string;
     children: React.ReactNode;
     disabled?: boolean;
   }) {
     return (
       <button
         type="button"
         onClick={onClick}
         title={title}
         disabled={disabled}
         data-active={active}
         className="p-1.5 rounded text-sm hover:bg-gray-200 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
       >
         {children}
       </button>
     );
   }
   ```

## Complete Modified File

The full updated `tiptap-editor.tsx` should:
- Import `Image` from `@tiptap/extension-image`
- Import `ImageIcon`, `Loader2` from lucide-react
- Import `uploads` from api-resources
- Add `uploading` state and `fileInputRef`
- Add `handleImageUpload` function
- Include `Image` in extensions array
- Add image button and hidden file input in toolbar
- Update `ToolbarButton` with disabled prop

## Todo List
- [ ] Install `@tiptap/extension-image` package
- [ ] Add Image extension to editor
- [ ] Add file input ref and uploading state
- [ ] Implement handleImageUpload function
- [ ] Add image toolbar button with loading state
- [ ] Update ToolbarButton to support disabled
- [ ] Test: upload image, verify in description
- [ ] Test: image appears in product detail page

## Success Criteria
- [ ] Image button visible in TipTap toolbar
- [ ] Clicking opens file picker
- [ ] Selected image uploads and inserts at cursor
- [ ] Loading indicator shown during upload
- [ ] Error messages for invalid files
- [ ] Images display correctly in saved description

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large images slow page | Medium | Medium | Resize on server or limit dimensions |
| Upload fails silently | Low | Medium | Show error toast/alert |
| Auth token missing | Low | High | Check token before upload |

## Security Considerations
- File type validated client-side AND server-side (server already validates)
- File size limited (10MB)
- Upload requires admin JWT token
- Images served from controlled upload directory

## Future Enhancements (Out of Scope)
- Image resize handles in editor
- Image alignment (left/center/right)
- Image alt text dialog
- Drag-and-drop image insertion
- Paste image from clipboard
