# Users

User profile management (self) and admin user administration.

## User Profile (Self)

### Get Current User Profile
**GET** `/users/me`

Retrieve current authenticated user's profile.

**Authentication:** Bearer token required

**Response (200 OK):**
```json
{
  "data": {
    "id": "user-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "phone": "+1234567890",
    "role": 2,
    "status": 1,
    "created_at": "2026-04-28T10:00:00Z",
    "updated_at": "2026-04-28T10:00:00Z"
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `404 Not Found` — User does not exist

---

### Update Current User Profile
**PUT** `/users/me`

Update current user's profile information.

**Authentication:** Bearer token required

**Request Body:** (all fields optional)
```json
{
  "full_name": "Jane Doe",
  "address": "456 Oak Ave",
  "phone": "+0987654321"
}
```

**Response (204 No Content)**

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `409 Conflict` — Phone number already in use

---

## Admin User Management

### List Users
**GET** `/admin/users`

Retrieve all users with pagination. **Requires Admin role.**

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
      "id": "user-uuid-1",
      "full_name": "John Doe",
      "email": "john@example.com",
      "address": "123 Main St",
      "phone": "+1234567890",
      "role": 2,
      "status": 1,
      "created_at": "2026-04-28T10:00:00Z",
      "updated_at": "2026-04-28T10:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

**Errors:**
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin

---

### Get User
**GET** `/admin/users/:id`

Retrieve a specific user by ID. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID (UUID) |

**Response (200 OK):**
```json
{
  "data": {
    "id": "user-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "phone": "+1234567890",
    "role": 2,
    "status": 1,
    "created_at": "2026-04-28T10:00:00Z",
    "updated_at": "2026-04-28T10:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` — Invalid user ID format
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — User does not exist

---

### Create User
**POST** `/admin/users`

Create a new user. **Requires Admin role.**

**Authentication:** Bearer token required

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "address": "456 Oak Ave",
  "phone": "+9876543210",
  "role": 2,
  "status": 1
}
```

Role values:
- `1` — Admin
- `2` — Customer (default)

Status values:
- `1` — Active
- `2` — Inactive

**Response (201 Created):**
```json
{
  "data": {
    "id": "user-uuid-new",
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "address": "456 Oak Ave",
    "phone": "+9876543210",
    "role": 2,
    "status": 1,
    "created_at": "2026-05-08T10:00:00Z",
    "updated_at": "2026-05-08T10:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `409 Conflict` — Email or phone already in use

---

### Update User
**PUT** `/admin/users/:id`

Update a user. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID (UUID) |

**Request Body:** (all fields optional)
```json
{
  "full_name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "address": "789 Pine St",
  "phone": "+5555555555",
  "role": 1,
  "status": 2
}
```

**Response (204 No Content)**

**Errors:**
- `400 Bad Request` — Invalid input or ID format
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — User does not exist
- `409 Conflict` — Email or phone already in use

---

### Delete User
**DELETE** `/admin/users/:id`

Delete a user. **Requires Admin role.**

**Authentication:** Bearer token required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID (UUID) |

**Response (204 No Content)**

**Errors:**
- `400 Bad Request` — Invalid user ID format
- `401 Unauthorized` — Missing JWT token
- `403 Forbidden` — User is not admin
- `404 Not Found` — User does not exist
