---
phase: 2
title: Production Docker Compose
status: completed
priority: P1
effort: 30m
dependencies:
  - 1
---

# Phase 2: Production Docker Compose

## Overview

Tạo `docker-compose.prod.yml` với production configuration: no volume mounts for source, proper restart policies, resource limits.

## Requirements

- Use production Dockerfiles
- No source code volume mounts
- Restart policy: `unless-stopped`
- Environment variables from `.env.prod`
- Proper service dependencies

## Related Code Files

- Create: `docker/docker-compose.prod.yml`
- Create: `docker/.env.prod.example`

## Implementation Steps

### Step 1: Create docker-compose.prod.yml

Create `docker/docker-compose.prod.yml`:

```yaml
name: rol-outfit-prod

services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rol-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      APP_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      FACEBOOK_APP_ID: ${FACEBOOK_APP_ID}
      FACEBOOK_APP_SECRET: ${FACEBOOK_APP_SECRET}
      OAUTH_ALLOWED_REDIRECT_URIS: ${OAUTH_ALLOWED_REDIRECT_URIS}
      OAUTH_CALLBACK_BASE_URL: ${OAUTH_CALLBACK_BASE_URL}
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - rol-net

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: https://roloutfit.io.vn/api
      API_URL: http://backend:8080
    networks:
      - rol-net

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ../nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - uploads:/app/uploads:ro
    depends_on:
      - backend
      - frontend
    networks:
      - rol-net

volumes:
  postgres_data:
  uploads:

networks:
  rol-net:
    driver: bridge
```

### Step 2: Create .env.prod.example

Create `docker/.env.prod.example`:

```bash
# Database
DB_USER=roloutfit
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=roloutfit_prod

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET=CHANGE_ME_64_CHAR_RANDOM_STRING

# OAuth (optional, remove if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
OAUTH_ALLOWED_REDIRECT_URIS=https://roloutfit.io.vn/auth/callback
OAUTH_CALLBACK_BASE_URL=https://roloutfit.io.vn
```

### Step 3: Update .gitignore

Add to root `.gitignore`:

```
# Production secrets
docker/.env.prod
nginx/ssl/*.pem
nginx/ssl/*.key
```

## Success Criteria

- [ ] `docker compose -f docker/docker-compose.prod.yml config` validates successfully
- [ ] No source code volume mounts in compose
- [ ] All services have `restart: unless-stopped`
- [ ] `.env.prod.example` contains all required variables
- [ ] Secrets excluded from git

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Secrets committed to git | .gitignore patterns, verify before commit |
| DB data loss | Named volume `postgres_data` persists data |
| Service startup order | healthcheck + depends_on.condition |
