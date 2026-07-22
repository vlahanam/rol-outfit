# Authentication

User registration and login endpoints.

## Register User
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

## Login User
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

## JWT Token Usage

All authenticated endpoints require the Authorization header:

```
Authorization: Bearer {token}
```

Where `{token}` is the JWT received from `/auth/login`.

Tokens are valid for the session. Store the token in localStorage (frontend) or secure HTTP-only cookies (recommended for production).
