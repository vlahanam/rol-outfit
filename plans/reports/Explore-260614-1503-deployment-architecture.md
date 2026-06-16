# rol-outfit Deployment Architecture Scout Report

**Date:** 2026-06-14 | **Project:** /home/ubuntu/longan/rol-outfit

## Executive Summary

rol-outfit is a full-stack e-commerce application with a **containerized Docker Compose architecture** supporting both development and production deployments. The stack features Go/Fiber backend, Next.js frontend, PostgreSQL database, and Nginx reverse proxy.

---

## 1. Docker Architecture

### Docker Compose Files

**Development:** `/home/ubuntu/longan/rol-outfit/docker/docker-compose.yml`
- Service: `db` (PostgreSQL 17-alpine)
- Service: `backend` (Go/Fiber w/ hot-reload via Air)
- Service: `frontend` (Next.js dev server)
- Service: `nginx` (reverse proxy on port 80)
- Network: `rol-outfit-net`
- Volumes: postgres_data, go_cache
- Port mapping: 5454:5432 (db), 80:80 (nginx)

**Production:** `/home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml`
- Same services with prod-optimized configs
- Network: `rol-net`
- Port mapping: 80:80, 443:443 (SSL)
- Volumes: postgres_data (persistent), uploads (shared)
- Uses Dockerfile.prod for both backend and frontend (multi-stage builds)

### Backend Dockerfiles

**Development:** `/home/ubuntu/longan/rol-outfit/backend/Dockerfile.dev`
- Base: `golang:1.26-alpine`
- Tool: Air (hot-reload runner)
- Entry: `air -c .air.toml`
- Mounts entire /app directory for live reload

**Production:** `/home/ubuntu/longan/rol-outfit/backend/Dockerfile.prod`
- Multi-stage builder pattern
- Stage 1 (builder): golang:1.26-alpine
  - Builds binary: `go build -ldflags="-w -s" -o server ./src/cmd/main.go`
  - CGO_ENABLED=0 (static linking)
- Stage 2 (runtime): alpine:3.20
  - Includes ca-certificates, tzdata
  - Copies binary + migrations from builder
  - Creates /app/uploads directory
  - Exposes port 8080
  - Minimal footprint

### Frontend Dockerfiles

**Development:** `/home/ubuntu/longan/rol-outfit/frontend/Dockerfile.dev`
- Base: `node:22-alpine`
- Command: `npm run dev`
- Mounts /app directory with named volume for node_modules/.next

**Production:** `/home/ubuntu/longan/rol-outfit/frontend/Dockerfile.prod`
- Multi-stage (deps → builder → runner)
- Stage 1 (deps): Installs npm dependencies
- Stage 2 (builder): Builds Next.js with `npm run build`
  - NEXT_TELEMETRY_DISABLED=1
- Stage 3 (runner): node:22-alpine
  - Uses next/standalone output (optimized bundle)
  - Non-root user: nextjs (uid 1001)
  - Only copies public, .next/standalone, .next/static
  - Exposes port 3000

---

## 2. Nginx Configuration

### Development Config
**Path:** `/home/ubuntu/longan/rol-outfit/nginx/conf.d/default.conf`

- Listen: port 80
- Server: localhost
- Upstreams:
  - `backend`: backend:8080
  - `frontend`: frontend:3000
- Key routes:
  - `/_next/webpack-hmr` → frontend (WebSocket HMR)
  - `/uploads/` → static file alias with 30d cache
  - `/api/` → backend proxy (10m max body, 60s timeout)
  - `/` → frontend proxy

### Production Config
**Path:** `/home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf`

- Listen: 443 (SSL HTTP/2), 80 (redirect to HTTPS)
- Server: roloutfit.io.vn
- SSL certificates: `/etc/nginx/ssl/origin.pem` + key (Cloudflare Origin)
- SSL settings:
  - TLSv1.2, TLSv1.3
  - Strong ciphers (ECDHE-ECDSA/RSA)
  - Session cache: 10m, timeout 1d
- Security headers:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- Gzip compression (level 6)
- Keepalive connections (32 per upstream)
- Error pages: 50x.html
- API timeout: 10s connect, 60s read
- Body size: 10m (uploads)

### SSL Certificates
- Location: `/home/ubuntu/longan/rol-outfit/nginx/ssl/`
- Files: origin.pem, origin-key.pem
- Provider: Cloudflare Origin (mutual TLS)

---

## 3. Backend Structure (Go/Fiber v3)

### Stack
- Language: Go 1.26.2
- Framework: Fiber v3.2.0
- Database: PostgreSQL 17 (GORM + pgx/v5)
- Auth: JWT (golang-jwt/v5)
- Validation: ozzo-validation/v4
- Migrations: golang-migrate/v4
- i18n: go-i18n/v2

### Project Layout
```
backend/
├── src/
│   ├── cmd/
│   │   ├── main.go          [Entry: initialize.Run()]
│   │   └── seed/main.go     [Database seeder]
│   └── internal/
│       ├── initialize/      [Bootstrap: config, DB, routes]
│       ├── controllers/     [HTTP handlers]
│       ├── services/        [Business logic]
│       ├── repositories/    [GORM + database]
│       ├── models/          [GORM models]
│       ├── middleware/      [JWT, RBAC]
│       ├── dto/             [Response types]
│       ├── requests/        [Validation]
│       ├── common/          [Utilities]
│       ├── i18n/            [Translations: vi, ja]
│       └── seeder/          [Test data]
├── database/
│   └── migrations/          [golang-migrate SQL files]
├── uploads/                 [Runtime: user uploads]
├── go.mod / go.sum
├── Dockerfile.dev / .prod
├── .air.toml                [Hot-reload config]
└── .dockerignore

```

### Key Config Loading
**File:** `/home/ubuntu/longan/rol-outfit/backend/src/internal/initialize/loadconfig.go`

Environment variables (with defaults):
- `APP_PORT` (default: 8080)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (required for production, default: "change-me-in-production")
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `OAUTH_ALLOWED_REDIRECT_URIS` (comma-separated)
- `OAUTH_CALLBACK_BASE_URL`
- `UPLOAD_DIR` (default: /app/uploads)
- `UPLOAD_URL` (default: /uploads)
- `UPLOAD_MAX_SIZE` (default: 10 MB in bytes)
- `MIGRATIONS_PATH` (default: database/migrations)

Database: PostgreSQL DSN with TimeZone=Asia/Ho_Chi_Minh

### Startup Flow
1. LoadConfig() reads environment
2. RunMigrations() applies database migrations
3. InitDB(cfg) connects to PostgreSQL
4. Background goroutine: cleanup expired refresh tokens every 6 hours
5. InitRoutes(app, db, cfg) registers API routes
6. app.Listen(":8080") starts HTTP server

---

## 4. Frontend Structure (Next.js)

### Stack
- Framework: Next.js 16.2.4
- Library: React 19.2.4
- Styling: Tailwind CSS v4
- i18n: next-intl v4.11.0
- Forms: react-hook-form + zod
- Rich editor: TipTap
- Rich UI: shadcn/ui (Radix + Tailwind)
- Drag-n-drop: dnd-kit

### Project Layout
```
frontend/
├── app/                    [Next.js App Router]
├── components/             [React components]
├── context/                [React context]
├── hooks/                  [Custom hooks]
├── i18n/                   [Translations]
├── lib/                    [Utilities]
├── messages/               [i18n strings]
├── public/                 [Static assets]
├── types/                  [TypeScript types]
├── package.json
├── next.config.ts          [Configuration]
├── proxy.ts                [API proxy for SSR]
├── tsconfig.json
├── Dockerfile.dev / .prod
├── .dockerignore
└── AGENTS.md              [Notes on Next.js breaking changes]

```

### Build Config
**File:** `/home/ubuntu/longan/rol-outfit/frontend/next.config.ts`

- Output: `'standalone'` (optimized for containers, no node_modules needed in runtime)
- Remote images: empty (no external image optimization)
- Redirects: /admin → /admin/dashboard
- Plugin: next-intl for i18n routing

### Environment Variables
**Development:**
- `NEXT_PUBLIC_API_URL=http://localhost/api`
- `API_URL=http://backend:8080` (SSR calls)

**Production:**
- `NEXT_PUBLIC_API_URL=https://roloutfit.io.vn/api`
- `API_URL=http://backend:8080` (internal SSR calls)

---

## 5. Environment Configuration

### Development
**File:** `/home/ubuntu/longan/rol-outfit/docker/.env.example`

```env
DB_USER=
DB_PASSWORD=
DB_NAME=

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/login/callback
OAUTH_CALLBACK_BASE_URL=http://localhost:8080
```

### Production
**File:** `/home/ubuntu/longan/rol-outfit/docker/.env.prod.example`

```env
DB_USER=roloutfit
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=roloutfit_prod

JWT_SECRET=CHANGE_ME_64_CHAR_RANDOM_STRING

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
OAUTH_ALLOWED_REDIRECT_URIS=https://roloutfit.io.vn/auth/callback
OAUTH_CALLBACK_BASE_URL=https://roloutfit.io.vn
```

### Actual Env Files
- `/home/ubuntu/longan/rol-outfit/docker/.env` (dev - loaded by Makefile)
- `/home/ubuntu/longan/rol-outfit/docker/.env.prod` (production)
- Not tracked in git (likely in .gitignore)

---

## 6. Deployment & Management Scripts

### Makefile
**File:** `/home/ubuntu/longan/rol-outfit/Makefile`

All commands use: `docker compose -f docker/docker-compose.yml --env-file docker/.env`

**Service Management:**
- `make up` — Start all services (detached)
- `make down` — Stop all services
- `make rebuild` — Rebuild images + restart
- `make logs` — Tail logs
- `make ps` — Show running containers
- `make build` — Build images only

**Database:**
- `make db-shell` — Interactive PostgreSQL shell
- `make db-logs` — Tail database logs
- `make db-dump` — Backup to `docker/backup_YYYYMMDD_HHMMSS.sql`
- `make db-restore FILE=path` — Restore from SQL file
- `make db-migrate` — Restart backend (runs migrations)
- `make db-reset` — Drop schema + recreate (dev only)

**Development Shells:**
- `make backend-shell` — sh in backend container
- `make frontend-shell` — sh in frontend container

**Data:**
- `make seed` — Run database seeder
- `make frontend-reinstall` — Clean cache + npm install + restart
- `make frontend-clear-cache` — Clean .next + restart

### CI/CD
- **No GitHub Actions / GitLab CI** detected in repository root
- No `.github/workflows`, `.gitlab-ci.yml`, or other CI configs found
- Deployment likely manual or via external CI/CD system

### Deployment Scripts
- No shell scripts (*.sh) for deployment found in project root
- Docker Compose used directly for orchestration

---

## 7. Key Deployment Characteristics

### Health Checks
Both dev and prod use PostgreSQL healthcheck:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
  interval: 5s (dev) / 10s (prod)
  timeout: 5s
  retries: 5
```

### Restart Policies
All services: `restart: unless-stopped`

### Volume Strategy

**Development:**
- `/backend:/app` — Live code reload
- `/backend/uploads:/app/uploads` — Persistent uploads
- `go_cache:/go/pkg/mod` — Go module cache
- `/frontend:/app` — Live code reload
- Named volume `/app/node_modules`, `/app/.next` — Preserve build artifacts

**Production:**
- `postgres_data:/var/lib/postgresql/data` — Database persistence
- `uploads:/app/uploads` — Shared uploads volume (backend writes, nginx reads)

### Network Isolation
- Dev: `rol-outfit-net` bridge network
- Prod: `rol-net` bridge network
- Services communicate via internal network (backend:8080, frontend:3000, db:5432)

### File Upload Handling
- Backend: `/app/uploads` directory (created in Dockerfile)
- Nginx: Proxies `/uploads/` → alias to `/app/uploads/`
- Caching: 30 days with immutable header
- Max upload: 10 MB (nginx config)

---

## 8. Security Configuration

### TLS/SSL (Production Only)
- Certificates: `/home/ubuntu/longan/rol-outfit/nginx/ssl/`
- Type: Cloudflare Origin (mutual TLS)
- Enforced: HTTP → HTTPS redirect on port 80

### Security Headers
- SAMEORIGIN (clickjacking protection)
- nosniff (MIME type sniffing)
- XSS protection enabled
- Strict Referrer-Policy

### Non-Root User (Frontend)
- Production frontend runs as user `nextjs` (uid 1001)
- Backend runs as root (not hardened)

### JWT
- Required for production: `JWT_SECRET` env var
- Used for authentication/authorization
- Cleanup: Background goroutine deletes expired refresh tokens

---

## 9. Database

### Configuration
- PostgreSQL 17-alpine
- Timezone: Asia/Ho_Chi_Minh
- Connection pool via GORM + pgx/v5
- Migrations: golang-migrate/v4 (auto-run on startup)

### Backup/Restore
- Manual via `make db-dump` and `make db-restore FILE=...`
- No automated backup strategy in compose files

---

## Database Migrations

**Location:** `/home/ubuntu/longan/rol-outfit/backend/database/migrations/`

Naming convention (golang-migrate):
- `000001_name.up.sql` — apply
- `000001_name.down.sql` — rollback

Auto-executed on backend startup via `RunMigrations()`.

---

## 10. Summary Table

| Component | Dev/Prod | Technology | Port | Notes |
|-----------|----------|-----------|------|-------|
| Frontend | Both | Next.js 16.2.4 | 3000 | Standalone output, i18n support |
| Backend | Both | Go 1.26 + Fiber v3 | 8080 | GORM + PostgreSQL, JWT auth |
| Database | Both | PostgreSQL 17 | 5432 | Migrations on startup |
| Reverse Proxy | Both | Nginx 1.27 | 80/443 | WebSocket HMR (dev), SSL (prod) |
| Container Orchestration | Both | Docker Compose | - | Makefile wrapper |
| Secret Management | - | Env files | - | No vault/secrets manager |
| CI/CD | - | None detected | - | Manual deployment likely |
| Backup | - | Manual SQL dump | - | No automated backups |

---

## 11. Missing / Recommended Additions

### For Production Readiness
1. **CI/CD Pipeline** — GitHub Actions / GitLab CI for testing & deployment
2. **Secret Management** — Move from .env to HashiCorp Vault / AWS Secrets Manager
3. **Monitoring** — Add Prometheus metrics + Grafana dashboards
4. **Logging** — Centralized logs (ELK, Loki, CloudWatch)
5. **Backup Strategy** — Automated PostgreSQL backups to S3/GCS
6. **Load Balancing** — For multi-instance deployments
7. **Health Endpoints** — Liveness/readiness probes for orchestrators
8. **Security Hardening** — Non-root backend user, network policies
9. **Rate Limiting** — At Nginx or API level
10. **CORS Configuration** — Explicit in nginx config

### Documentation
- No deployment runbook in repo (only Makefile)
- No troubleshooting guide
- No SLA/RTO/RPO documentation

---

## File Manifest

### Docker
- `/home/ubuntu/longan/rol-outfit/docker/docker-compose.yml` — Dev
- `/home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml` — Prod
- `/home/ubuntu/longan/rol-outfit/docker/.env.example` — Dev template
- `/home/ubuntu/longan/rol-outfit/docker/.env.prod.example` — Prod template
- `/home/ubuntu/longan/rol-outfit/docker/.env` — Dev (actual)
- `/home/ubuntu/longan/rol-outfit/docker/.env.prod` — Prod (actual)

### Nginx
- `/home/ubuntu/longan/rol-outfit/nginx/conf.d/default.conf` — Dev config
- `/home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf` — Prod config
- `/home/ubuntu/longan/rol-outfit/nginx/ssl/origin.pem` — Certificate
- `/home/ubuntu/longan/rol-outfit/nginx/ssl/origin-key.pem` — Private key

### Backend
- `/home/ubuntu/longan/rol-outfit/backend/Dockerfile.dev`
- `/home/ubuntu/longan/rol-outfit/backend/Dockerfile.prod`
- `/home/ubuntu/longan/rol-outfit/backend/go.mod` — Go dependencies
- `/home/ubuntu/longan/rol-outfit/backend/src/cmd/main.go` — Entry point
- `/home/ubuntu/longan/rol-outfit/backend/src/internal/initialize/` — Bootstrap
- `/home/ubuntu/longan/rol-outfit/backend/database/migrations/` — SQL migrations
- `/home/ubuntu/longan/rol-outfit/backend/.air.toml` — Hot-reload config

### Frontend
- `/home/ubuntu/longan/rol-outfit/frontend/Dockerfile.dev`
- `/home/ubuntu/longan/rol-outfit/frontend/Dockerfile.prod`
- `/home/ubuntu/longan/rol-outfit/frontend/package.json` — Dependencies
- `/home/ubuntu/longan/rol-outfit/frontend/next.config.ts` — Build config

### Management
- `/home/ubuntu/longan/rol-outfit/Makefile` — All common tasks

---

## Conclusion

**rol-outfit** follows a modern containerized microservices pattern with clear separation of concerns. The architecture supports rapid local development via Docker Compose while providing production-grade SSL, security headers, and static file caching. Configuration management via environment files is straightforward but lacks secrets management best practices.

**Readiness:** Development-ready with basic production support. Requires CI/CD, monitoring, and backup automation for true production deployment.

