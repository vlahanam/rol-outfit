# Products & Variants

Product catalog management and product variants (different versions of a product).

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

## Product Variants

Variants represent different versions (size, color, etc.) of a single product.

### List Variants
**GET** `/products/:productID/variants`

Retrieve all variants for a product.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `productID` | uint | Product ID |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "var-001",
      "product_id": "1",
      "attributes": {"size": "M", "color": "blue"},
      "price": 29.99,
      "stock": 50,
      "sold": 5,
      "avatar": "/uploads/var-uuid.jpg",
      "status": 1,
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

---

### Get Variant
**GET** `/products/:productID/variants/:id`

Retrieve a single variant by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `productID` | uint | Product ID |
| `id` | string | Variant ID |

**Response (200 OK):**
```json
{
  "id": "var-001",
  "product_id": "1",
  "attributes": {"size": "M", "color": "blue"},
  "price": 29.99,
  "stock": 50,
  "sold": 5,
  "avatar": "/uploads/var-uuid.jpg",
  "status": 1,
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-01T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` — Variant does not exist

---

### Create Variant
**POST** `/products/:productID/variants`

Create a new variant for a product. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `productID` | uint | Product ID |

**Request Body:**
```json
{
  "attributes": {"size": "L", "color": "red"},
  "price": 34.99,
  "stock": 25,
  "avatar": "/uploads/var-uuid.jpg"
}
```

**Response (201 Created):**
```json
{
  "id": "var-002",
  "product_id": "1",
  "attributes": {"size": "L", "color": "red"},
  "price": 34.99,
  "stock": 25,
  "sold": 0,
  "avatar": "/uploads/var-uuid.jpg",
  "status": 1,
  "created_at": "2026-05-01T14:00:00Z",
  "updated_at": "2026-05-01T14:00:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid attributes (must match product's `attribute_names`)
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Product does not exist

---

### Update Variant
**PUT** `/products/:productID/variants/:id`

Update an existing variant. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:** (all fields optional)
```json
{
  "attributes": {"size": "XL"},
  "price": 39.99,
  "stock": 10,
  "avatar": "/uploads/new-var-uuid.jpg",
  "status": 2
}
```

**Response (200 OK):**
```json
{
  "id": "var-002",
  "product_id": "1",
  "attributes": {"size": "XL", "color": "red"},
  "price": 39.99,
  "stock": 10,
  "avatar": "/uploads/new-var-uuid.jpg",
  "status": 2,
  "created_at": "2026-05-01T14:00:00Z",
  "updated_at": "2026-05-01T15:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Variant does not exist

---

### Delete Variant
**DELETE** `/products/:productID/variants/:id`

Delete a variant. **Requires Admin role.**

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Variant does not exist

---

## Admin Products

### Admin List Products
**GET** `/admin/products`

Retrieve all products with full details including variants. **Requires Admin role.**

**Authentication:** Bearer token required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 10 | Items per page |

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
      "attribute_names": ["size", "color"],
      "variants": [
        {
          "id": "var-001",
          "product_id": "1",
          "attributes": {"size": "M", "color": "blue"},
          "price": 29.99,
          "stock": 50,
          "avatar": "/uploads/var-uuid.jpg",
          "status": 1
        }
      ],
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

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin

---

### Admin Get Product
**GET** `/admin/products/:id`

Retrieve a single product with all variants. **Requires Admin role.**

**Authentication:** Bearer token required

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
  "category_id": 5,
  "attribute_names": ["size", "color"],
  "variants": [
    {
      "id": "var-001",
      "product_id": "1",
      "attributes": {"size": "M", "color": "blue"},
      "price": 29.99,
      "stock": 50,
      "sold": 5,
      "avatar": "/uploads/var-uuid.jpg",
      "status": 1,
      "created_at": "2026-05-01T10:00:00Z"
    }
  ],
  "created_at": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Product does not exist
