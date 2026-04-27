---
phase: 3
title: docker-compose.yml + .env + Makefile
status: completed
priority: high
---

# Phase 3: docker-compose.yml + .env + Makefile

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [Dockerfiles](./phase-01-dockerfiles.md)
- Phase 2: [Services Config](./phase-02-services-config.md)

## Overview

Wire all services together in `docker/docker-compose.yml`, define env vars, and add Makefile shortcuts.

## `docker/docker-compose.yml`

```yaml
name: rol-outfit

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
      - rol-outfit-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      APP_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    volumes:
      - ../backend:/app
      - go_cache:/root/go/pkg/mod
    depends_on:
      db:
        condition: service_healthy
    networks:
      - rol-outfit-net

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost/api
    volumes:
      - ../frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - rol-outfit-net

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ../nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - backend
      - frontend
    networks:
      - rol-outfit-net

volumes:
  postgres_data:
  go_cache:

networks:
  rol-outfit-net:
    driver: bridge
```

**Key decisions:**
- `go_cache` volume caches Go module downloads across rebuilds
- `node_modules` and `.next` use anonymous volume mount (`/app/node_modules`) to prevent host override — npm install runs inside container
- Backend port NOT exposed directly; all traffic goes through Nginx on port 80
- DB port NOT exposed; backend connects via Docker network
- `env_file` intentionally NOT used — env vars passed explicitly for clarity

## `docker/.env.example`

```env
DB_USER=rol_outfit
DB_PASSWORD=changeme
DB_NAME=rol_outfit_db
```

Copy to `docker/.env` (git-ignored) before running.

## `Makefile` (update root Makefile)

```makefile
COMPOSE = docker compose -f docker/docker-compose.yml --env-file docker/.env

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) up -d --build

ps:
	$(COMPOSE) ps

db-shell:
	$(COMPOSE) exec db psql -U $${DB_USER} -d $${DB_NAME}

backend-shell:
	$(COMPOSE) exec backend sh

frontend-shell:
	$(COMPOSE) exec frontend sh

.PHONY: up down logs build rebuild ps db-shell backend-shell frontend-shell
```

## `.gitignore` update

Add to root `.gitignore`:
```
docker/.env
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `docker/docker-compose.yml` | Create |
| `docker/.env.example` | Create |
| `Makefile` | Update (add Docker targets) |
| `.gitignore` | Update (add `docker/.env`) |

## Implementation Steps

1. Create `docker/docker-compose.yml` per spec
2. Create `docker/.env.example`
3. Copy `.env.example` → `docker/.env` (local only, not committed)
4. Update root `Makefile` with Docker targets
5. Update `.gitignore` to exclude `docker/.env`
6. Verify: `docker compose -f docker/docker-compose.yml config` validates without errors

## Todo

- [ ] Create `docker/docker-compose.yml`
- [ ] Create `docker/.env.example`
- [ ] Copy to `docker/.env` (local)
- [ ] Update `Makefile`
- [ ] Update `.gitignore`

## Success Criteria

- `make build` builds all images without error
- `make up` starts all 4 services
- `http://localhost` serves Next.js frontend
- `http://localhost/api` proxies to Go backend
- Editing a `.go` file triggers Air rebuild (visible in `make logs`)
- Editing a frontend file triggers Next.js HMR (visible in browser without refresh)
- `make db-shell` connects to PostgreSQL

## Risk Assessment

- **Next.js app not initialized**: `frontend/` is currently empty. The frontend Dockerfile will fail at `npm ci` if `package.json` doesn't exist. → Must initialize Next.js app (`npx create-next-app@latest`) before running Docker build.
- **Go 1.26 image**: Check Docker Hub availability; use `golang:1.25-alpine` as fallback.
- **Port 80 conflicts**: If port 80 is in use, change Nginx mapping to `"8080:80"` in compose file.
