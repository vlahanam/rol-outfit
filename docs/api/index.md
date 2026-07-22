# API Reference

Complete REST API documentation for rol-outfit backend. Base URL: `http://localhost/api/v1`

## API Sections

### Core Resources
- [Authentication](./auth.md) — User registration and login
- [Products](./products.md) — Product CRUD and variants
- [Categories](./categories.md) — Product categories
- [Shopping Cart](./cart.md) — Cart operations
- [Orders](./orders.md) — Order management

### Admin Resources
- [Users](./users.md) — User management (self profile + admin CRUD)
- [Uploads](./uploads.md) — File upload and deletion
- [Widgets](./widgets.md) — Dashboard widget system

### Response Format
- [Error Responses](./response-format.md) — Standard error format, status codes, pagination

## Quick Reference

| Feature | Endpoint | Auth | Role |
|---------|----------|------|------|
| Register | `POST /auth/register` | — | — |
| Login | `POST /auth/login` | — | — |
| Products | `GET /products`, `POST /products` | JWT (POST) | Admin (POST) |
| Variants | `GET/POST /products/:id/variants` | JWT (POST) | Admin (POST) |
| Categories | `GET /categories`, `POST /categories` | JWT (POST) | Admin (POST) |
| Cart | `GET/POST /cart/items` | JWT | User |
| Orders | `GET/POST /orders` | JWT | User |
| Users | `GET /users/me`, `CRUD /admin/users/:id` | JWT | Admin (CRUD) |
| Upload | `POST /uploads` | JWT | Admin |
| Widgets | `GET /widgets`, `CRUD /widgets/:id` | JWT (CRUD) | Admin (CRUD) |

## Getting Started

1. **Register a user** — `POST /auth/register` with email and password
2. **Login** — `POST /auth/login` to receive JWT token
3. **Make authenticated requests** — Include header: `Authorization: Bearer {token}`
4. **Browse products** — `GET /products` (no auth required)
5. **Admin operations** — Use admin account (role=1) for write operations

See individual endpoint documentation for request/response examples and error codes.
