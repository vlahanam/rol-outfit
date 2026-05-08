# Orders

Order management for users and administrators.

## User Orders

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
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist

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

### Cancel Order
**DELETE** `/orders/:id`

Cancel a pending order.

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist
- `409 Conflict` — Cannot cancel completed order

---

## Admin Orders

### List All Orders
**GET** `/admin/orders`

Retrieve all orders (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status |
| `page` | int | 1 | Page number |
| `limit` | int | 10 | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 101,
      "user_id": 1,
      "status": "completed",
      "total_amount": 89.97,
      "items": [...],
      "created_at": "2026-04-28T09:15:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin

---

### Update Order Status
**PUT** `/admin/orders/:id/status`

Update order status (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "status": "completed"
}
```

Valid statuses: `pending`, `completed`, `cancelled`

**Response (200 OK):**
```json
{
  "id": 101,
  "status": "completed",
  "updated_at": "2026-04-28T15:00:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid status
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Order does not exist
