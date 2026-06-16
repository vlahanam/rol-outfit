# Brainstorm Report: Cloudflare Deployment for roloutfit.io.vn

**Date:** 2026-06-08
**Status:** Approved
**Environment:** Staging/Preview

---

## Problem Statement

Domain `roloutfit.io.vn` đã kết nối với Cloudflare. Cần setup production deployment để mọi người có thể truy cập website.

## Requirements

### Functional
- Website accessible via https://roloutfit.io.vn
- Backend API at https://roloutfit.io.vn/api
- File uploads served at /uploads
- Database persistence

### Non-Functional
- SSL/HTTPS với Cloudflare Full (Strict)
- Production-grade Docker images (no dev tools)
- Security headers
- Auto-restart on failure

## Current State Analysis

| Component | Current | Required Change |
|-----------|---------|-----------------|
| Backend Dockerfile | Dev (air hot-reload) | Multi-stage prod build |
| Frontend Dockerfile | Dev (next dev) | Multi-stage standalone build |
| Nginx | localhost, HTTP only | SSL, domain config |
| Docker Compose | Dev volumes mounted | Production compose |
| Environment | Hardcoded secrets | External .env.prod |

## Evaluated Approaches

### Approach A: Docker-only (Selected)
- All services in Docker containers
- Nginx handles SSL with Cloudflare Origin Certificate
- Simple, self-contained

**Pros:** Simple, portable, easy maintenance
**Cons:** SSL cert renewal manual (15 years with Cloudflare Origin)

### Approach B: Docker + Systemd
- Docker containers managed by systemd
- Better process management

**Pros:** Auto-start on boot, better logging
**Cons:** More complex, requires systemd config

### Approach C: External Reverse Proxy
- Nginx/Caddy outside Docker
- More flexibility for multiple apps

**Pros:** Flexible, can serve multiple projects
**Cons:** More moving parts, harder to deploy

## Final Solution

**Approach A: Docker-only** with:

1. **Production Dockerfiles**
   - `backend/Dockerfile.prod`: Multi-stage Go build → Alpine runtime
   - `frontend/Dockerfile.prod`: Multi-stage Next.js standalone

2. **Production Docker Compose**
   - `docker/docker-compose.prod.yml`
   - No source volume mounts
   - Production environment variables

3. **Nginx SSL Config**
   - `nginx/conf.d/production.conf`
   - Listen 443 with Cloudflare Origin Certificate
   - Security headers (HSTS, X-Frame-Options, etc.)
   - Gzip compression

4. **Environment Template**
   - `docker/.env.prod.example`

## Architecture

```
Internet → Cloudflare (HTTPS) → VPS:443 (HTTPS) → Nginx → Backend/Frontend
```

## Implementation Phases

1. **Phase 1**: Create production Dockerfiles
2. **Phase 2**: Create production docker-compose
3. **Phase 3**: Create Nginx SSL config
4. **Phase 4**: Environment setup & manual SSL cert
5. **Phase 5**: Deploy & verify

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| SSL cert expiry | Cloudflare Origin: 15 years |
| DB data loss | Docker volume persistence |
| Memory issues | Resource limits in compose |
| Secret leaks | .env.prod in .gitignore |

## Success Criteria

- [ ] https://roloutfit.io.vn loads frontend
- [ ] https://roloutfit.io.vn/api/v1/products returns JSON
- [ ] SSL certificate valid (Cloudflare shows green lock)
- [ ] Uploads accessible at /uploads

## Next Steps

Run `/ck:plan` to create detailed implementation plan with specific file contents and commands.
