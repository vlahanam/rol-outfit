---
title: Docker Dev Environment Setup
status: completed
priority: high
created: 2026-04-28
blockedBy: []
blocks: []
---

# Docker Dev Environment Setup

Full Docker Compose dev environment for rol-outfit: Go/Fiber backend (Air hot reload), Next.js 15 frontend (HMR), PostgreSQL, and Nginx reverse proxy.

## Phases

| # | Phase | Status | Est. Effort |
|---|-------|--------|-------------|
| 1 | [Dockerfiles — Backend & Frontend](./phase-01-dockerfiles.md) | completed | 30 min |
| 2 | [Services Config — Nginx & PostgreSQL](./phase-02-services-config.md) | completed | 20 min |
| 3 | [docker-compose.yml + .env + Makefile](./phase-03-docker-compose.md) | completed | 20 min |

## Key Dependencies

- Air (`github.com/air-verse/air`) for Go hot reload
- `node:22-alpine` base for Next.js 15 dev
- `postgres:17-alpine` for DB
- `nginx:1.27-alpine` for reverse proxy

## Files Created/Modified

```
backend/Dockerfile.dev
backend/.air.toml
frontend/Dockerfile.dev
nginx/conf.d/default.conf
docker/docker-compose.yml
docker/.env.example
Makefile
```

## Architecture

```
Browser → Nginx:80
              ├── /api/* → backend:8080 (Go/Fiber + Air)
              └── /*     → frontend:3000 (Next.js 15 HMR)

backend → db:5432 (PostgreSQL)
```

Network: single bridge `rol-outfit-net`
Volumes: `postgres_data` for DB persistence, bind mounts for hot reload
