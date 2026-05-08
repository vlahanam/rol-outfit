# File Upload

File upload and deletion for images and documents.

### Upload File
**POST** `/uploads`

Upload an image file for use in products or user profiles. **Requires Admin role.**

**Authentication:** Bearer token required

**Request:** Multipart form data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image file (JPEG, PNG, WebP, GIF) |

**cURL Example:**
```bash
curl -X POST http://localhost/api/v1/uploads \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.jpg"
```

**Response (201 Created):**
```json
{
  "url": "/uploads/a1b2c3d4-e5f6-g7h8.jpg"
}
```

**Errors:**
- `400 Bad Request` — File field missing
- `401 Unauthorized` — Missing/invalid JWT token
- `403 Forbidden` — User is not admin
- `413 Payload Too Large` — File exceeds 10 MB limit
- `422 Unprocessable Entity` — Invalid file type (only JPEG, PNG, WebP, GIF allowed)
- `500 Internal Server Error` — Server error during upload

**Allowed MIME Types:**
- `image/jpeg` → `.jpg`
- `image/png` → `.png`
- `image/webp` → `.webp`
- `image/gif` → `.gif`

**File Storage:**
- Maximum size: 10 MB (configurable via `UPLOAD_MAX_SIZE` env var)
- Files stored with UUID filename: `/uploads/{uuid}.{ext}`
- Served via Nginx at `/uploads/{filename}`

---

### Delete File
**DELETE** `/uploads/:filename`

Delete an uploaded file. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `filename` | string | Filename with extension (e.g., `a1b2c3d4.jpg`) |

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing/invalid JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — File does not exist
- `500 Internal Server Error` — Server error during deletion

---

## Upload Workflow

**Typical flow for product avatar:**

1. Upload image → `POST /api/v1/uploads` → receive URL
2. Use URL in product creation/update → `POST/PUT /api/v1/products` with `avatar` field
3. If replacing existing file, delete old file → `DELETE /api/v1/uploads/{old_filename}`

**Frontend pattern (React):**
```typescript
// Upload file
const response = await api.uploads.upload(file);
const url = response.url;

// Create/update product with avatar URL
await api.products.create({
  name: "Product",
  avatar: url,
  ...
});

// Delete old file if needed
await api.uploads.delete(oldFilename);
```
