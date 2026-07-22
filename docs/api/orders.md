# Orders

Order management for users and administrators with comprehensive status lifecycle and audit trail.

## Order Status Reference

| Value | Status | Vietnamese | Description |
|-------|--------|-----------|-------------|
| 1 | AWAITING_PAYMENT | Chờ chuyển khoản | Waiting for payment |
| 2 | PAYMENT_SUBMITTED | Đã báo CK | Payment transfer reported |
| 3 | CONFIRMED | Xác nhận thành công | Payment confirmed |
| 4 | SHIPPING | Đang giao | In transit |
| 5 | COMPLETED | Hoàn thành | Delivered |
| 6 | CANCELLED | Đã hủy | Cancelled (terminal) |
| 7 | REFUND_REQUESTED | Yêu cầu hoàn tiền | Refund requested |
| 8 | REFUNDED | Đã hoàn tiền | Refunded (terminal) |

## User Orders

### List Orders
**GET** `/orders`

Retrieve current user's order history.

**Authentication:** Bearer token required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | int | - | Filter by status (1-8) |
| `page` | int | 1 | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "status": 5,
      "total_amount": 89.97,
      "order_code": "ROL-260608-0001",
      "items": [
        {
          "id": "uuid",
          "product_id": "uuid",
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

Retrieve a specific order with full details.

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": 5,
  "total_amount": 89.97,
  "order_code": "ROL-260608-0001",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "product_id": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 3,
      "unit_price": 29.99
    }
  ],
  "shipping_address": "123 Main St, City, State",
  "phone": "+84912345678",
  "created_at": "2026-04-28T09:15:00Z",
  "updated_at": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist

---

### Create Order
**POST** `/orders`

Convert current user's cart into an order. Order begins in AWAITING_PAYMENT status.

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "shipping_address": "123 Main St, City, State 12345",
  "phone": "+84912345678",
  "note": "Please deliver after 5 PM"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": 1,
  "order_code": "ROL-260608-0001",
  "total_amount": 89.97,
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 3,
      "unit_price": 29.99
    }
  ],
  "shipping_address": "123 Main St, City, State 12345",
  "phone": "+84912345678",
  "note": "Please deliver after 5 PM",
  "created_at": "2026-04-28T14:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Invalid input or empty cart
- `401 Unauthorized` — Missing JWT token

---

### Mark Order as Transferred
**PUT** `/orders/:id/mark-transferred`

Mark order as payment transferred (transitions from AWAITING_PAYMENT to PAYMENT_SUBMITTED).

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "message": "Order marked as transferred"
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist
- `409 Conflict` — Order is not in AWAITING_PAYMENT status

---

### Cancel Order
**DELETE** `/orders/:id`

Cancel a pending order. Only allowed for orders in AWAITING_PAYMENT or PAYMENT_SUBMITTED status.

**Authentication:** Bearer token required

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist
- `409 Conflict` — Order cannot be cancelled in current status

---

### Request Refund
**POST** `/orders/:id/refund`

Request refund on a completed order (transitions from COMPLETED to REFUND_REQUESTED).

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Request Body:**
```json
{
  "reason": "Product arrived damaged"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "message": "Refund requested"
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist
- `409 Conflict` — Order is not in COMPLETED status

---

### Get Order History
**GET** `/orders/:id/history`

Retrieve order status transition history for audit trail.

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "from_status": 1,
      "to_status": 2,
      "changed_by": "550e8400-e29b-41d4-a716-446655440001",
      "note": "Payment transfer submitted",
      "created_at": "2026-04-28T09:20:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "from_status": 2,
      "to_status": 3,
      "changed_by": "admin-id-uuid",
      "note": "Payment confirmed",
      "created_at": "2026-04-28T09:30:00Z"
    }
  ]
}
```

**History Item Fields:**
- `id` — History record identifier
- `order_id` — Associated order
- `from_status` — Previous status (null for initial creation)
- `to_status` — New status after transition
- `changed_by` — User/admin who triggered transition (null if system-initiated)
- `note` — Reason or context for transition
- `created_at` — Timestamp of transition

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — Not order owner
- `404 Not Found` — Order does not exist

---

## Admin Orders

### List All Orders
**GET** `/admin/orders`

Retrieve all orders (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | int | 0 (all) | Filter by status (1-8) |
| `page` | int | 1 | Page number |
| `limit` | int | 10 | Items per page |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "status": 3,
      "total_amount": 89.97,
      "order_code": "ROL-260608-0001",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "customer@example.com"
      },
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

### Get Admin Order Details
**GET** `/admin/orders/:id`

Retrieve order details with full information (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": 5,
    "total_amount": 89.97,
    "order_code": "ROL-260608-0001",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "product_id": "550e8400-e29b-41d4-a716-446655440003",
        "quantity": 3,
        "unit_price": 29.99
      }
    ],
    "shipping_address": "123 Main St, City, State",
    "phone": "+84912345678",
    "note": "Please deliver after 5 PM",
    "created_at": "2026-04-28T09:15:00Z",
    "updated_at": "2026-04-28T10:00:00Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Order does not exist

---

### Update Order Status
**PUT** `/admin/orders/:id/status`

Update order status with transition validation (admin only). **Requires Admin role.**

Status transitions are validated per the state machine defined in the Order Status Reference above.

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Request Body:**
```json
{
  "status": 3,
  "note": "Payment verified and confirmed"
}
```

**Response (204 No Content)**

**Errors:**
- `400 Bad Request` — Invalid status or validation failure
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Order does not exist
- `409 Conflict` — Invalid status transition (e.g., cannot go backwards)

---

### Approve Refund
**PUT** `/admin/orders/:id/approve-refund`

Approve a refund request, transitioning from REFUND_REQUESTED to REFUNDED (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Response (204 No Content)**

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Order does not exist
- `409 Conflict` — Order is not in REFUND_REQUESTED status

---

### Reject Refund
**PUT** `/admin/orders/:id/reject-refund`

Reject a refund request, transitioning from REFUND_REQUESTED back to COMPLETED (admin only). **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Order ID |

**Request Body:**
```json
{
  "reason": "Product is undamaged; return not accepted"
}
```

**Response (204 No Content)**

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — Order does not exist
- `409 Conflict` — Order is not in REFUND_REQUESTED status
