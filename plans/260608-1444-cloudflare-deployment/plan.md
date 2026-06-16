---
title: Production Deployment for roloutfit.io.vn
description: >-
  Setup production deployment với Cloudflare Full (Strict) SSL cho
  staging/preview environment
status: pending
priority: P1
branch: develop
tags:
  - deployment
  - cloudflare
  - docker
  - ssl
blockedBy: []
blocks: []
created: '2026-06-08T14:52:10.648Z'
createdBy: 'ck:plan'
source: skill
---

# Production Deployment for roloutfit.io.vn

## Overview

Deploy rol-outfit full-stack application (Go/Fiber backend + Next.js frontend) to VPS Ubuntu với:
- Domain: roloutfit.io.vn (đã kết nối Cloudflare)
- SSL: Cloudflare Full (Strict) với Origin Certificate
- Environment: Staging/Preview
- Containerization: Docker Compose

## Architecture

```
Internet → Cloudflare (HTTPS) → VPS:443 (HTTPS) → Nginx → Backend/Frontend
                                                    ↓
                                              PostgreSQL
```

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Production Dockerfiles](./phase-01-production-dockerfiles.md) | Pending | Completed |
| 2 | [Production Docker Compose](./phase-02-production-docker-compose.md) | Pending | Completed |
| 3 | [Nginx SSL Configuration](./phase-03-nginx-ssl-configuration.md) | Pending | Completed |
| 4 | [Environment Setup and Deployment](./phase-04-environment-setup-and-deployment.md) | Pending | Completed |

**Total Effort:** ~3h

## Files to Create

| File | Purpose |
|------|---------|
| `backend/Dockerfile.prod` | Multi-stage Go build (~15MB image) |
| `frontend/Dockerfile.prod` | Multi-stage Next.js standalone (~100MB image) |
| `docker/docker-compose.prod.yml` | Production compose config |
| `nginx/conf.d/production.conf` | HTTPS config với domain |
| `docker/.env.prod.example` | Template environment variables |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/next.config.ts` | Add `output: 'standalone'` |
| `.gitignore` | Add `.env.prod`, `nginx/ssl/*.pem` |

## Dependencies

- Cloudflare Origin Certificate (manual generation)
- VPS với Docker + Docker Compose installed
- Domain DNS configured in Cloudflare

## Success Criteria

- [ ] https://roloutfit.io.vn loads frontend
- [ ] https://roloutfit.io.vn/api/v1/products returns JSON
- [ ] SSL certificate valid (green lock in browser)
- [ ] Uploads accessible at /uploads
- [ ] Auto-restart on container failure

## Context

- Brainstorm: `plans/reports/brainstorm-260608-1444-cloudflare-deployment.md`
- System Architecture: `docs/system-architecture.md`
