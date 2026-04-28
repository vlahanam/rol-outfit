# API Reference

Complete REST API documentation for rol-outfit backend. Base URL: `http://localhost/api/v1`

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "user"
}
```

**Errors:**
- `400 Bad Request` — Invalid input (missing fields, invalid email)
- `409 Conflict` — Email already registered

---

### Login User
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Errors:**
- `400 Bad Request` — Missing credentials
- `401 Unauthorized` — Invalid email or password

---

## Products

### List Products
**GET** `/products`

Retrieve all products with pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 10 | Items per page |
| `category` | string | No | - | Filter by category slug |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "T-Shirt",
      "slug": "t-shirt",
      "description": "Cotton t-shirt",
      "price": 29.99,
      "image": "/images/tshirt.jpg",
      "avatar": "/uploads/a1b2c3d4.jpg",
      "category_id": 5,
      "created_at": "2026-04-28T10:00:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

---

### Get Product Details
**GET** `/products/:id`

Retrieve a single product by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uint | Product ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "T-Shirt",
  "slug": "t-shirt",
  "description": "Premium cotton t-shirt",
  "price": 29.99,
  "image": "/images/tshirt.jpg",
  "avatar": "/uploads/a1b2c3d4.jpg",
  "category": {
    "id": 5,
    "name": "Clothing",
    "slug": "clothing"
  },
  "created_at": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` — Product does not exist

---

### Create Product
**POST** `/products`

Create a new product. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "name": "New T-Shirt",
  "description": "Premium cotton fabric",
  "price": 39.99,
  "image": "/images/new-tshirt.jpg",
  "avatar": "/uploads/uuid.jpg",
  "category_id": 5
}
```

**Response (201 Created):**
```json
{
  "id": 42,
  "name": "New T-Shirt",
  "slug": "new-t-shirt",
  "description": "Premium cotton fabric",
  "price": 39.99,
  "image": "/images/new-tshirt.jpg",
  "avatar": "/uploads/uuid.jpg",
  "category_id": 5,
  "created_at": "2026-04-28T14:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input (missing required fields, invalid price)
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Category ID does not exist
- `409 Conflict` — Product name/slug already exists

---

### Update Product
**PUT** `/products/:id`

Update an existing product. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uint | Product ID |

**Request Body:** (all fields optional)
```json
{
  "name": "Updated T-Shirt",
  "description": "Updated description",
  "price": 49.99,
  "avatar": "/uploads/new-uuid.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "name": "Updated T-Shirt",
  "slug": "updated-t-shirt",
  "description": "Updated description",
  "price": 49.99,
  "avatar": "/uploads/new-uuid.jpg",
  "updated_at": "2026-04-28T15:45:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Product does not exist

---

### Delete Product
**DELETE** `/products/:id`

Delete a product. **Requires Admin role.**

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Product does not exist

---

## File Upload

### Upload File
**POST** `/uploads`

Upload an image file for use in products or user profiles. **Requires authentication.**

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

## Categories

### List Categories
**GET** `/categories`

Retrieve all product categories.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Clothing",
      "slug": "clothing",
      "created_at": "2026-04-28T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Accessories",
      "slug": "accessories",
      "created_at": "2026-04-28T10:05:00Z"
    }
  ]
}
```

---

### Get Category
**GET** `/categories/:id`

Retrieve a single category with product count.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uint | Category ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Clothing",
  "slug": "clothing",
  "product_count": 15,
  "created_at": "2026-04-28T10:00:00Z"
}
```

---

### Create Category
**POST** `/categories`

Create a new category. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "name": "Shoes"
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "name": "Shoes",
  "slug": "shoes",
  "created_at": "2026-04-28T14:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `409 Conflict` — Category name already exists

---

### Update Category
**PUT** `/categories/:id`

Update a category. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "name": "Updated Name",
  "slug": "updated-name",
  "updated_at": "2026-04-28T15:30:00Z"
}
```

---

### Delete Category
**DELETE** `/categories/:id`

Delete a category. **Requires Admin role.**

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Category does not exist
- `409 Conflict` — Category has associated products

---

## Shopping Cart

### Get User Cart
**GET** `/cart`

Retrieve current user's shopping cart.

**Authentication:** Bearer token required

**Response (200 OK):**
```json
{
  "id": 10,
  "user_id": 1,
  "items": [
    {
      "id": 45,
      "product_id": 1,
      "product": {
        "id": 1,
        "name": "T-Shirt",
        "price": 29.99,
        "avatar": "/uploads/a1b2c3d4.jpg"
      },
      "quantity": 2,
      "created_at": "2026-04-28T12:00:00Z"
    }
  ],
  "total_price": 59.98
}
```

---

### Add to Cart
**POST** `/cart/items`

Add a product to current user's cart.

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "id": 45,
  "product_id": 1,
  "quantity": 2,
  "created_at": "2026-04-28T12:00:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid quantity
- `401 Unauthorized` — Missing JWT token
- `404 Not Found` — Product does not exist

---

### Remove from Cart
**DELETE** `/cart/items/:item_id`

Remove an item from user's cart.

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `404 Not Found` — Cart item does not exist
- `403 Forbidden` — Not item owner

---

## Orders

### List Orders
**GET** `/orders`

Retrieve current user's order history.

**Authentication:** Bearer token required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (pending, completed, cancelled) |
| `page` | int | 1 | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 101,
      "user_id": 1,
      "status": "completed",
      "total_amount": 89.97,
      "items": [
        {
          "id": 1,
          "product_id": 5,
          "quantity": 3,
          "unit_price": 29.99
        }
      ],
      "created_at": "2026-04-28T09:15:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

### Get Order Details
**GET** `/orders/:id`

Retrieve a specific order.

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uint | Order ID |

**Response (200 OK):**
```json
{
  "id": 101,
  "user_id": 1,
  "status": "completed",
  "total_amount": 89.97,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 5,
        "name": "Premium T-Shirt",
        "avatar": "/uploads/uuid.jpg"
      },
      "quantity": 3,
      "unit_price": 29.99
    }
  ],
  "shipping_address": "123 Main St, City, State",
  "created_at": "2026-04-28T09:15:00Z",
  "completed_at": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `404 Not Found` — Order does not exist
- `403 Forbidden` — Not order owner

---

### Create Order
**POST** `/orders`

Convert current user's cart into an order.

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "shipping_address": "123 Main St, City, State 12345",
  "notes": "Please deliver after 5 PM"
}
```

**Response (201 Created):**
```json
{
  "id": 102,
  "user_id": 1,
  "status": "pending",
  "total_amount": 89.97,
  "items": [
    {
      "product_id": 5,
      "quantity": 3,
      "unit_price": 29.99
    }
  ],
  "shipping_address": "123 Main St, City, State 12345",
  "created_at": "2026-04-28T14:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input or empty cart
- `401 Unauthorized` — Missing JWT token

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

**Common Status Codes:**

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded (no body) |
| 400 | Bad Request | Invalid input or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or constraint violation |
| 413 | Payload Too Large | Request body exceeds size limit |
| 422 | Unprocessable Entity | Validation failed (invalid file type, etc.) |
| 500 | Internal Server Error | Server error |

---

## Authentication Header

All authenticated endpoints require:

```
Authorization: Bearer {token}
```

Where `{token}` is the JWT received from `/auth/login`.

---

## Rate Limiting

Currently no rate limiting. Future versions may implement per-user request limits.

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

Default pagination: page 1, limit 10 items.

