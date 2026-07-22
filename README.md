# rol-outfit

Full-stack fashion e-commerce application. Go/Fiber v3 backend, Next.js frontend, PostgreSQL, Nginx reverse proxy — all containerized with Docker.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Go 1.26 + Fiber v3 |
| Database | PostgreSQL 17 |
| Proxy | Nginx 1.27 |
| Frontend | Next.js (in progress) |
| Container | Docker Compose |

## Quick Start

```bash
# 1. Create environment file
cp docker/.env.example docker/.env   # edit DB credentials

# 2. Start all services
make up

# 3. Seed development data
make seed
```

**Access:**
- Frontend: http://localhost
- API: http://localhost/api/v1
- Uploaded files: http://localhost/uploads/

## Makefile Commands

```bash
make up             # Start all services (detached)
make down           # Stop all services
make rebuild        # Rebuild images and start
make logs           # Tail compose logs
make ps             # Show running containers
make seed           # Seed database with demo data
make db-shell       # PostgreSQL interactive shell
make backend-shell  # Backend container shell
make frontend-shell # Frontend container shell
```

## Environment Variables

Create `docker/.env`:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rol_outfit
JWT_SECRET=change-me-in-production
UPLOAD_DIR=/app/uploads
UPLOAD_URL=/uploads
UPLOAD_MAX_SIZE=10485760   # 10 MB in bytes
```

## API Endpoints

Base URL: `http://localhost/api/v1`

### Auth
```
POST /auth/register   — create account
POST /auth/login      — get JWT token
```

### Categories
```
GET    /categories        — list (public)
GET    /categories/:id    — detail (public)
POST   /categories        — create [admin]
PUT    /categories/:id    — update [admin]
DELETE /categories/:id    — delete [admin]
```

### Products
```
GET    /products          — list, filter by ?category_id= (public)
GET    /products/:id      — detail (public)
POST   /products          — create [admin]
PUT    /products/:id      — update [admin]
DELETE /products/:id      — delete [admin]
```

### Cart
```
GET    /cart              — get current user's cart [auth]
POST   /cart/items        — add item [auth]
PUT    /cart/items/:id    — update quantity [auth]
DELETE /cart/items/:id    — remove item [auth]
```

### Orders
```
POST   /orders            — checkout from cart [auth]
GET    /orders            — list own orders [auth]
GET    /orders/:id        — order detail [auth]
DELETE /orders/:id        — cancel order [auth]
GET    /admin/orders      — list all orders [admin]
PUT    /admin/orders/:id/status — update status [admin]
```

### File Uploads
```
POST   /uploads           — upload image, returns { url } [auth]
DELETE /uploads/:filename — delete file [admin]
```

Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif` · Max: 10 MB

## Seed Accounts

After running `make seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@rol-outfit.com | Admin@123 | Admin |
| customer1@rol-outfit.com | Customer@123 | Customer |
| customer2@rol-outfit.com | Customer@123 | Customer |

> These are development credentials only. Never run the seeder against production.

## Project Structure

```
backend/
  src/
    cmd/
      main.go           — API server entry point
      seed/main.go      — Database seeder
    internal/
      controllers/      — HTTP handlers (Fiber)
      services/         — Business logic
      repositories/     — Database access (GORM)
      models/           — GORM models
      dto/              — Response types
      requests/         — Request validation
      middleware/        — JWT auth, RBAC
      seeder/           — Seed data
      common/           — Shared utilities (Slugify, pagination, errors)
      i18n/             — Translations (vi, ja)
      initialize/       — App bootstrap (config, DB, routes)
  database/migrations/  — golang-migrate SQL files
docker/
  docker-compose.yml
  Dockerfile.dev (backend)
nginx/
  conf.d/default.conf
frontend/               — Next.js (in progress)
docs/                   — Architecture, API reference, changelog
```

## Backend Development

```bash
# Run without Docker
cd backend && go run ./src/cmd/main.go

# Build binary
cd backend && go build -o bin/server ./src/cmd/main.go

# Run seeder directly
cd backend && go run ./src/cmd/seed/main.go

# Compile check
cd backend && go build ./src/...

# Lint (requires golangci-lint)
cd backend && golangci-lint run
```

## Database Migrations

Migrations run automatically on backend startup. Files are in `backend/database/migrations/` following the `golang-migrate` convention (`000001_name.up.sql` / `.down.sql`).

## Docs

- [`docs/system-architecture.md`](docs/system-architecture.md) — Architecture overview
- [`docs/api-reference.md`](docs/api-reference.md) — Full API documentation
- [`docs/code-standards.md`](docs/code-standards.md) — Coding conventions
- [`docs/development-roadmap.md`](docs/development-roadmap.md) — Project roadmap
- [`docs/project-changelog.md`](docs/project-changelog.md) — Changelog
