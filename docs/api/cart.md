# Shopping Cart

Shopping cart operations for authenticated users.

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

### Update Cart Item
**PUT** `/cart/items/:item_id`

Update quantity of a cart item.

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response (200 OK):**
```json
{
  "id": 45,
  "product_id": 1,
  "quantity": 5,
  "updated_at": "2026-04-28T12:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid quantity
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not item owner
- `404 Not Found` — Cart item does not exist

---

### Remove from Cart
**DELETE** `/cart/items/:item_id`

Remove an item from user's cart.

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not item owner
- `404 Not Found` — Cart item does not exist
