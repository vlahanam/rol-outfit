---
phase: 2
title: Services Config — Nginx & PostgreSQL
status: completed
priority: high
---

# Phase 2: Services Config — Nginx & PostgreSQL

## Context Links
- Plan: [plan.md](./plan.md)

## Overview

Configure Nginx as reverse proxy (routes `/api/*` → backend, `/*` → frontend) and set up PostgreSQL initialization.

## Nginx — `nginx/conf.d/default.conf`

```nginx
upstream backend {
    server backend:8080;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # Next.js HMR websocket
    location /_next/webpack-hmr {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Key detail:** `/_next/webpack-hmr` must be proxied with WebSocket upgrade headers for Next.js HMR to work through Nginx.

## PostgreSQL

No custom Dockerfile needed — use `postgres:17-alpine` with env vars.

Optional init script `docker/postgres/init.sql` for creating the app database and user:

```sql
-- Runs on first container startup (empty data volume)
CREATE DATABASE rol_outfit_db;
```

This is optional since `POSTGRES_DB` env var already creates the DB. Only add if custom extensions or schemas are needed at init time.

## Files to Create

| File | Action |
|------|--------|
| `nginx/conf.d/default.conf` | Create |
| `docker/postgres/init.sql` | Create (optional — only if init SQL needed) |

## Implementation Steps

1. Create `nginx/conf.d/default.conf` per spec above
2. Skip `init.sql` for now — POSTGRES_DB env var handles DB creation

## Todo

- [ ] Create `nginx/conf.d/default.conf`

## Success Criteria

- Nginx config is valid (`nginx -t` passes)
- `/api/` requests strip the prefix before forwarding to backend
- Next.js HMR works through Nginx (WebSocket upgrade)

## Risk Assessment

- **Path stripping**: `proxy_pass http://backend/` (trailing slash) strips `/api/` prefix — verify Fiber routes don't expect `/api/` prefix
- **WebSocket for HMR**: Must proxy `/_next/webpack-hmr` and generic websocket upgrade for frontend; without this, hot reload won't work through Nginx
- **CORS**: Since Nginx handles routing, CORS on the Go backend is not needed for same-origin requests
