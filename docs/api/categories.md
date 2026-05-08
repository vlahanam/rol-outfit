# Categories

Product category management.

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
