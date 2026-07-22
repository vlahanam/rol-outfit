# Response Format

Standard response formats, error handling, and pagination across all API endpoints.

## Success Response Format

### With Data
```json
{
  "data": {
    "id": 1,
    "name": "Product Name"
  }
}
```

### With Pagination
```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "total": 100,
    "page": 2,
    "limit": 10,
    "pages": 10
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Example:**
```json
{
  "status": "error",
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## HTTP Status Codes

| Code | Status | Meaning | Example |
|------|--------|---------|---------|
| 200 | OK | Request succeeded | `GET /products` |
| 201 | Created | Resource created successfully | `POST /products` |
| 204 | No Content | Request succeeded (no body) | `DELETE /products/:id` |
| 400 | Bad Request | Invalid input or malformed request | Invalid email format |
| 401 | Unauthorized | Missing or invalid authentication | Missing JWT token |
| 403 | Forbidden | Authenticated but insufficient permissions | User is not admin |
| 404 | Not Found | Resource not found | Product ID doesn't exist |
| 409 | Conflict | Resource already exists or constraint violation | Email already registered |
| 413 | Payload Too Large | Request body exceeds size limit | File > 10 MB |
| 422 | Unprocessable Entity | Validation failed (invalid file type, etc.) | Invalid image format |
| 500 | Internal Server Error | Server error | Database connection failed |

---

## Common Error Codes

### Authentication
- `UNAUTHORIZED` — Missing or invalid JWT token
- `INVALID_TOKEN` — Token is malformed or expired
- `FORBIDDEN` — Insufficient permissions for operation

### Validation
- `INVALID_INPUT` — Request body has invalid fields
- `INVALID_EMAIL` — Email format is invalid
- `INVALID_PASSWORD` — Password doesn't meet requirements
- `INVALID_FILE_TYPE` — File is not an allowed type
- `FILE_TOO_LARGE` — File exceeds maximum size

### Resource
- `NOT_FOUND` — Resource does not exist
- `ALREADY_EXISTS` — Resource already exists (e.g., email taken)
- `CONFLICT` — Business logic conflict (e.g., category has products)

### Validation Errors with Details
Some endpoints return detailed validation errors:

```json
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## Pagination

Endpoints supporting pagination include:

```json
"meta": {
  "total": 100,      // Total items available
  "page": 2,         // Current page
  "limit": 10,       // Items per page
  "pages": 10        // Total pages
}
```

**Default pagination:** page 1, limit 10 items

**Query parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Example:**
```
GET /products?page=2&limit=20
```

---

## Timestamp Format

All timestamps are in ISO 8601 format (UTC):

```
2026-05-08T14:30:00Z
```

---

## Authentication Header

All authenticated endpoints require:

```
Authorization: Bearer {token}
```

Where `{token}` is the JWT received from `/auth/login`.

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost/api/v1/users/me
```

---

## Localization (i18n)

Some error messages support multiple languages. Include Accept-Language header:

```
Accept-Language: vi-VN
Accept-Language: ja-JP
Accept-Language: en-US (default)
```

Error messages and validation strings will be returned in the specified language if available.

**Example:**
```bash
curl -H "Accept-Language: vi-VN" \
  http://localhost/api/v1/auth/register \
  -d '{"email": "test", "password": "123"}'
```

---

## Rate Limiting

Currently, rate limiting is not implemented. Future versions may include per-user request limits.

---

## CORS Headers

The API supports CORS requests from the frontend application. Requests from `http://localhost:3000` (frontend dev server) are allowed.
