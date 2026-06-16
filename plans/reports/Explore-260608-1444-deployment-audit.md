# rol-outfit Production Deployment Audit

**Scout Date**: 2026-06-08 | **Project**: rol-outfit | **Status**: Early-stage, development-focused

---

## Executive Summary

The rol-outfit project is a **full-stack fashion e-commerce application** with a Go/Fiber backend, Next.js frontend, PostgreSQL database, and Nginx reverse proxy. The infrastructure is containerized via Docker Compose but **lacks production-grade configuration and deployment automation**.

### Current State
- ✓ Development environment fully functional
- ✓ Core services configured (backend, frontend, database, proxy)
- ✗ No production Dockerfiles
- ✗ No production environment templates
- ✗ No CI/CD pipeline
- ✗ No health checks or monitoring
- ✗ No secrets management
- ✗ No auto-scaling/orchestration

---

## 1. Docker Configuration

### Current Setup

**Location**: `/docker/docker-compose.yml`

| Service | Image | Status | Type |
|---------|-------|--------|------|
| **PostgreSQL** | `postgres:17-alpine` | ✓ Production-ready | Database |
| **Backend** | `Dockerfile.dev` | ✗ Development only | API |
| **Frontend** | `Dockerfile.dev` | ✗ Development only | Web |
| **Nginx** | `nginx:1.27-alpine` | ✓ Production base | Proxy |

### Backend Dockerfile (Development)
```dockerfile
FROM golang:1.26-alpine
RUN apk add --no-cache git && \
    go install github.com/air-verse/air@latest  # Hot-reload tool
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
CMD ["air", "-c", ".air.toml"]  # Development runner
```

**Issues**:
- Uses `air` (live-reload), unsuitable for production
- No multi-stage build or binary optimization
- Installs unnecessary build tools in final image
- No health checks

### Frontend Dockerfile (Development)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
CMD ["npm", "run", "dev"]  # Development server
```

**Issues**:
- Runs `next dev` instead of production build
- No multi-stage build (dev dependencies in final image)
- No static export optimization
- Missing environment configuration

### Missing Production Dockerfiles
**Need to create**:
- `backend/Dockerfile.prod` — Multi-stage build with binary
- `frontend/Dockerfile.prod` — Build optimization + static export
- `docker-compose.prod.yml` — Production-specific overrides

---

## 2. Nginx Configuration

### Current Setup

**Location**: `/nginx/conf.d/default.conf`

**Routing**:
```nginx
location /api/          → backend:8080
location /_next/webpack-hmr → frontend:3000  (dev HMR)
location /uploads/      → /app/uploads/ (static files)
location /              → frontend:3000  (default)
```

### Configuration Gaps

| Feature | Status | Issue |
|---------|--------|-------|
| HTTP/2 | ✗ | No `http2` directive |
| HTTPS/TLS | ✗ | No SSL configuration |
| Gzip compression | ✗ | Not configured |
| Security headers | ✗ | Missing X-Frame-Options, CSP, etc. |
| Rate limiting | ✗ | Not configured |
| Access logging | ✗ | Not configured |
| Request buffering | ✓ | `client_max_body_size 10m` |
| Caching | ✓ | `/uploads/` cached 30 days |
| WebSocket upgrade | ✓ | Configured for HMR |

### Missing for Production
1. **SSL/TLS certificates** (Let's Encrypt, ACM, etc.)
2. **Security headers** (HSTS, X-Content-Type-Options, etc.)
3. **Gzip compression** for API responses
4. **Access & error logging** for debugging
5. **Production server_name** (domain-based)
6. **Load balancing** (if scaling backend/frontend)

---

## 3. Backend Structure (Go/Fiber v3)

### Architecture

```
backend/
├── src/
│   ├── cmd/
│   │   ├── main.go           ✓ API server entry
│   │   └── seed/main.go      ✓ Database seeder
│   └── internal/
│       ├── controllers/      ✓ HTTP handlers (Fiber)
│       ├── services/         ✓ Business logic
│       ├── repositories/     ✓ Database access (GORM)
│       ├── models/           ✓ GORM models
│       ├── dto/              ✓ Response types
│       ├── requests/         ✓ Request validation
│       ├── middleware/       ✓ JWT auth, RBAC
│       ├── seeder/           ✓ Seed data
│       ├── common/           ✓ Shared utilities
│       ├── i18n/             ✓ Translations (vi, ja)
│       └── initialize/       ✓ App bootstrap
├── database/migrations/      ✓ golang-migrate SQL
├── Dockerfile.dev           ✗ Dev-only
├── .air.toml                ✓ Hot-reload config
└── uploads/                 ✓ File storage

**Module**: github.com/vlahanam/rol-outfit
**Go Version**: 1.26
**Framework**: Fiber v3
```

### Environment Configuration

**Entry point**: `backend/src/internal/initialize/loadconfig.go`

```go
LoadConfig() retrieves:
  AppPort              (default: 8080)
  DBHost, DBPort, DBUser, DBPassword, DBName
  JWTSecret            (default: "change-me-in-production" ⚠️)
  MigrationsPath       (default: "database/migrations")
  UploadDir, UploadURL, UploadMaxSize
  Google OAuth: ClientID, ClientSecret
  Facebook OAuth: AppID, AppSecret
  OAuth redirect URIs and callback base URL
```

### Database

**PostgreSQL 17 Alpine**
- Migrations: `golang-migrate` SQL files (1 file: `000001_init_schema.up.sql`)
- Schema includes: Users, OAuth providers, Addresses, Categories, Products, Cart, Orders, Widgets
- Healthcheck: `pg_isready` (5s interval, 5s timeout, 5 retries)
- Volume: `postgres_data` (persistent)

### API Routes

**Base**: `/api/v1`

**Authentication**:
- `POST /auth/register` — Create account
- `POST /auth/login` — Get JWT token

**Products & Categories**: CRUD endpoints (public read, admin write)

**Cart & Orders**: User-specific operations

**Uploads**: File operations with MIME validation

### Production Readiness Issues

| Concern | Status | Details |
|---------|--------|---------|
| JWT Secret | ✗ Hardcoded | Default `"change-me-in-production"` — must override in env |
| Error handling | ✓ | Panics/log.Fatal in DB initialization |
| Database pooling | ? | GORM handles; limits not configured |
| Graceful shutdown | ✗ | No signal handling for SIGTERM |
| Health checks | ✗ | No `/health` endpoint |
| Request logging | ✗ | No structured logging middleware |
| CORS | ? | Not documented |
| Rate limiting | ✗ | Not configured |
| Input validation | ✓ | ozzo-validation used |

---

## 4. Frontend Structure (Next.js 16.2.4)

### Setup

```
frontend/
├── app/                 ✓ App Router
├── components/          ✓ UI components
├── context/             ✓ React context
├── hooks/               ✓ Custom hooks
├── i18n/                ✓ Internationalization (next-intl)
├── lib/                 ✓ Utilities
├── messages/            ✓ i18n messages
├── types/               ✓ TypeScript types
├── public/              ✓ Static assets
├── Dockerfile.dev      ✗ Dev-only
├── next.config.ts      ✓ Next.js config
├── proxy.ts            ✓ next-intl middleware
├── tsconfig.json       ✓ TypeScript config
└── postcss.config.mjs  ✓ Tailwind CSS

**Framework**: Next.js 16.2.4 (latest with breaking changes)
**React**: 19.2.4
**Styling**: Tailwind CSS 4
**Internationalization**: next-intl
**UI Components**: Radix UI + shadcn/ui patterns
```

### Key Dependencies

```json
{
  "next": "16.2.4",
  "next-intl": "^4.11.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-hook-form": "^7.75.0",
  "zod": "^4.4.3",
  "@tiptap/react": "^3.23.1",
  "@dnd-kit/core": "^6.3.1",
  "tailwindcss": "^4"
}
```

### Environment

**Development**:
```env
NEXT_PUBLIC_API_URL=http://localhost/api    # Client-side API
API_URL=http://backend:8080                 # Server-side API (Docker)
```

**Issues**:
- No production environment template
- No NEXT_PUBLIC vars for production API endpoint
- Build configuration for static export not documented

### Production Readiness Issues

| Concern | Status | Details |
|---------|--------|---------|
| Build optimization | ✗ | No `next build` in docker-compose |
| Static export | ? | Not configured; requires `output: export` |
| Image optimization | ✗ | `remotePatterns: []` — no image optimization |
| Environment config | ✗ | Missing `.env.production` template |
| API URL config | ✗ | No production domain setup |

---

## 5. Current Environment Variables Setup

### Development (`.env`)
```
DB_USER=roloutfit
DB_PASSWORD=roloutfit123
DB_NAME=roloutfit

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/login/callback
OAUTH_CALLBACK_BASE_URL=http://localhost:8080
```

### Missing in Production

| Variable | Purpose | Criticality |
|----------|---------|-------------|
| `APP_ENV` | Development vs. Production | **HIGH** |
| `JWT_SECRET` | Signing JWTs (currently hardcoded) | **HIGH** |
| `DATABASE_URL` | Full DSN string | **HIGH** |
| `UPLOAD_DIR`, `UPLOAD_URL` | File storage paths | **MEDIUM** |
| `UPLOAD_MAX_SIZE` | File size limit (bytes) | **MEDIUM** |
| `LOG_LEVEL` | Logging verbosity | **MEDIUM** |
| `CORS_ORIGINS` | Allowed domains | **MEDIUM** |
| `SESSION_SECRET` | Session encryption | **HIGH** |
| `REDIS_URL` | Cache/sessions (if used) | **LOW** |

### Secrets Management
**Current**: Environment variables in `.env` file
**Risk**: Committed to version control if not careful

**Needs**:
- `.env.example` with all required vars (no secrets)
- `.env.production` template (not committed)
- Secrets manager integration (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## 6. Deployment & Production Configuration

### What's Missing

#### 1. Production Docker Compose
**File**: `docker/docker-compose.prod.yml`

**Needed**:
- Remove development volumes
- Use multi-stage prod images
- Set resource limits (memory, CPU)
- Configure logging drivers
- Add health checks for all services
- Use secrets management

#### 2. Production Dockerfiles

**Backend (`backend/Dockerfile.prod`)**:
```dockerfile
# Multi-stage: builder + runtime
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./src/cmd/main.go

FROM alpine:latest
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

**Frontend (`frontend/Dockerfile.prod`)**:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

#### 3. Production Nginx Configuration
**File**: `nginx/conf.d/production.conf`

**Needs**:
- HTTPS/SSL termination
- Security headers
- Gzip compression
- Rate limiting
- Logging configuration
- Cache control
- Health check endpoints

#### 4. Health Checks
**Missing endpoints**:
- `GET /health` — Liveness probe (backend)
- `GET /health/ready` — Readiness probe (all services)
- Checks: database connectivity, external services

#### 5. CI/CD Pipeline
**Missing**: `.github/workflows/` or equivalent

**Needed**:
- Automated testing (Go `go test`, Next.js `npm run build`)
- Docker image building & registry push
- Deployment triggers (on merge to `main`, manual)
- Environment-specific deployments

#### 6. Monitoring & Observability
**Missing**:
- Centralized logging (e.g., ELK stack, CloudWatch)
- Error tracking (e.g., Sentry, DataDog)
- Performance monitoring (APM)
- Metrics collection (Prometheus)
- Alerts configuration

#### 7. Database Management
**Needs**:
- Automated backups
- Point-in-time recovery setup
- Connection pooling (PgBouncer if needed)
- Read replicas (if scaling)

#### 8. Secrets Management
**Current**: Plain `.env` files
**Needed**:
- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- Or encrypted `.env.production` in secured repo

---

## 7. Deployment Platforms: Recommendations

### Lightweight Options (VPS/Self-Hosted)

| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **Docker Swarm** | Free | Simple, built-in orchestration | Limited auto-scaling |
| **DigitalOcean App Platform** | $6-12/mo | Simple Docker Compose deploy | Limited customization |
| **Render** | $12-100+/mo | Easy deploys, managed DB | Expensive at scale |

### Scalable Options (Cloud)

| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **AWS ECS** | Pay-per-use | Auto-scaling, load balancing | Complex setup |
| **AWS EKS** | ~$73/mo + compute | Full Kubernetes | Overhead for small teams |
| **Google Cloud Run** | Pay-per-use | Serverless, auto-scaling | Stateless only |
| **DigitalOcean Kubernetes** | $4-12/mo | Managed K8s, easy setup | Manual scaling config |

### Recommended for Early Stage
**DigitalOcean App Platform** or **Render**:
- Git push → auto-deploy
- Managed PostgreSQL
- Built-in Let's Encrypt SSL
- Easy env var management
- Simple scaling

---

## 8. Key Missing Files

| File | Type | Status | Impact |
|------|------|--------|--------|
| `backend/Dockerfile.prod` | Config | Missing | Cannot deploy backend |
| `frontend/Dockerfile.prod` | Config | Missing | Cannot deploy frontend |
| `docker/docker-compose.prod.yml` | Config | Missing | No production orchestration |
| `nginx/conf.d/production.conf` | Config | Missing | No HTTPS, security headers |
| `.github/workflows/deploy.yml` | CI/CD | Missing | No automated deploys |
| `.env.example` | Config | Partial | Incomplete vars listed |
| `.env.production` | Config | Missing | No prod var template |
| `docker/.dockerignore` | Config | Exists | Good |

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Create production Dockerfiles (multi-stage)
- [ ] Create `docker-compose.prod.yml`
- [ ] Create production Nginx config with SSL
- [ ] Add `/health` endpoint to backend
- [ ] Environment variables documented in `.env.example`
- [ ] JWT_SECRET generated and injected securely
- [ ] Database backups configured
- [ ] Secrets manager configured (AWS, Vault, etc.)

### During Deployment

- [ ] Build and push images to registry (DockerHub, ECR, etc.)
- [ ] Deploy to orchestration platform (Docker Swarm, ECS, K8s, etc.)
- [ ] Configure health checks and auto-restart
- [ ] Set up monitoring and logging
- [ ] Configure CDN (optional, for static assets)
- [ ] SSL certificates installed (Let's Encrypt)

### Post-Deployment

- [ ] Smoke tests on production domain
- [ ] Database integrity check
- [ ] Monitor error logs for 24h
- [ ] Set up alerting for critical errors
- [ ] Document runbook for on-call team

---

## 10. Production Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| HTTPS/TLS | ✗ | Must enable |
| JWT Secret | ✗ | Must set strong secret via env |
| CORS | ? | Not documented |
| Rate limiting | ✗ | Add to Nginx or Fiber |
| Input validation | ✓ | Using ozzo-validation |
| SQL injection | ✓ | Using GORM (parameterized) |
| XSS protection | ✓ | React escapes by default |
| CSRF tokens | ? | Not documented |
| Password hashing | ? | Need to verify (crypto/bcrypt?) |
| OAuth secrets | ✗ | Must not commit |
| API key rotation | ? | Not applicable yet |
| Database encryption | ✗ | Enable PostgreSQL encryption |
| Backup encryption | ✗ | Secure backup process needed |

---

## 11. Quick Start: Production Setup

### Step 1: Create Production Docker Config
```bash
# backend/Dockerfile.prod
# frontend/Dockerfile.prod
# docker/docker-compose.prod.yml
# nginx/conf.d/production.conf
```

### Step 2: Create Environment Templates
```bash
# docker/.env.production (template, not committed)
# Copy from docker/.env and update for production
```

### Step 3: Set Up CI/CD
```bash
# .github/workflows/build.yml
# .github/workflows/deploy.yml
```

### Step 4: Choose Deployment Platform
- DigitalOcean App Platform
- Render
- AWS ECS
- etc.

### Step 5: Configure Secrets
- Inject `JWT_SECRET`, OAuth credentials securely
- Use platform's secrets manager

### Step 6: Deploy
```bash
git push main
# CI/CD pipeline triggers
# Images built, tested, deployed to production
```

---

## Summary: Current vs. Production-Ready

| Component | Current | Needed |
|-----------|---------|--------|
| Docker images | Dev-only | Multi-stage prod builds |
| Environment | Dev template | Prod template + secrets manager |
| Nginx | Basic proxy | HTTPS, security headers, compression |
| Monitoring | None | Logging, error tracking, metrics |
| CI/CD | None | GitHub Actions / GitLab CI |
| Health checks | None | Liveness/readiness probes |
| Database | Dev only | Backups, replication, pooling |
| SSL/TLS | None | Let's Encrypt or managed certs |
| Rate limiting | None | Nginx or Fiber middleware |
| Documentation | Partial | Deployment runbook |

---

## Unresolved Questions

1. **Deployment platform**: Which platform (AWS, DigitalOcean, Render, self-hosted)?
2. **Database backups**: Strategy and retention period?
3. **Monitoring**: Existing setup (Prometheus, DataDog, CloudWatch)?
4. **CDN**: Use CDN for static assets and `/uploads/`?
5. **Database replication**: Multi-region or single-region?
6. **Auto-scaling**: Needed? Traffic projections?
7. **SSL certificate renewal**: Automated (Let's Encrypt) or manual?
8. **OAuth callback URLs**: Production domain determined?

---

**Report Generated**: 2026-06-08 14:44 UTC | **Surveyed Files**: 50+ | **Estimated Setup Time**: 2-4 weeks
