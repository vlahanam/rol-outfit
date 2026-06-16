# Brainstorm: Cloudflare Deployment cho rol-outfit

**Date:** 2026-06-14 | **Domain:** roloutfit.io.vn

## Requirements

| Requirement | Value |
|-------------|-------|
| Cloudflare Account | **Riêng** (không ảnh hưởng techcoffee) |
| Domain | roloutfit.io.vn + www |
| Architecture | Tunnel → Nginx → Apps |
| Subdomains | Không |

## Current State

- Docker containers running (backend, frontend, nginx, db)
- Old tunnel exists on wrong account (`de27ac9d-137f-4fdb-99fb-06b15acfedef`)
- Nginx configured for SSL (port 443) with Cloudflare Origin certs
- Domain returns HTTP 530 (tunnel error)

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                              │
│  ┌─────────────┐     ┌──────────────┐                       │
│  │ DNS Proxy   │────▶│ Argo Tunnel  │                       │
│  │ (SSL/CDN)   │     │ (encrypted)  │                       │
│  └─────────────┘     └──────────────┘                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼ :80
┌─────────────────────────────────────────────────────────────┐
│                        VPS                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  cloudflared tunnel (systemd service)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼ http://localhost:80             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NGINX (reverse proxy)                                │   │
│  │  ├── /api/*  → backend:8080                          │   │
│  │  ├── /uploads/* → static files                        │   │
│  │  └── /* → frontend:3000                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                    │                   │
│         ┌───────────┴────────┐  ┌────────┴──────────┐       │
│         ▼                    ▼  ▼                    │       │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────┐        │
│  │  Frontend   │    │   Backend    │    │ Postgres │        │
│  │  Next.js    │    │  Go/Fiber    │    │    17    │        │
│  │  :3000      │    │   :8080      │    │  :5432   │        │
│  └─────────────┘    └──────────────┘    └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Changes from Current Setup

| Component | Current | Proposed |
|-----------|---------|----------|
| SSL termination | Nginx (Cloudflare Origin cert) | Cloudflare (Full strict) |
| Nginx listen | 443 + 80 redirect | 80 only |
| Tunnel target | https://localhost:443 | http://localhost:80 |
| Account | Shared with techcoffee | **Separate** |
| Service | No systemd | **Has** systemd service |

## Implementation Steps

### Phase 1: Cloudflare Account Setup
1. Login cloudflared to new account - `cloudflared login`
2. Select roloutfit.io.vn domain
3. Cert saved to `~/.cloudflared/cert-roloutfit.pem`

### Phase 2: Create Tunnel
1. Create tunnel - `cloudflared tunnel create rol-outfit-prod`
2. Save credentials file path
3. Create config file `~/.cloudflared/config-roloutfit-prod.yml`

### Phase 3: DNS Routing
1. Route DNS via cloudflared - `cloudflared tunnel route dns rol-outfit-prod roloutfit.io.vn`
2. Route www subdomain - `cloudflared tunnel route dns rol-outfit-prod www.roloutfit.io.vn`

### Phase 4: Nginx Simplification
1. Create new nginx config (HTTP only, no SSL)
2. Remove SSL certificate volumes from docker-compose
3. Update docker-compose to expose only port 80

### Phase 5: Docker Compose Update
1. Remove port 443 mapping
2. Keep port 80 for tunnel connection
3. Rebuild nginx container

### Phase 6: Systemd Service
1. Create `/etc/systemd/system/cloudflared-roloutfit.service`
2. Enable and start service
3. Verify tunnel connectivity

### Phase 7: Cloudflare Dashboard
1. Enable SSL/TLS Full (strict) mode
2. Configure security settings
3. Setup caching rules

## Advantages

- ✅ **Complete separation** - No impact on techcoffee account/tunnels
- ✅ **Free SSL** - Cloudflare handles SSL, no cert management
- ✅ **DDoS protection** - Cloudflare proxy protection
- ✅ **Integrated CDN** - Cache static assets
- ✅ **Same pattern as techcoffee** - Easy to maintain

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Conflict with old tunnel | Delete old tunnel or rename |
| Port conflict | Docker compose only expose 80, not 443 |
| Account credentials | Separate cert file for each account |

## Reference

- techcoffee.cloud config: `/home/ubuntu/tools/cloudflared/cloudflared-techcoffee.yml`
- Deployment report: `/home/ubuntu/longan/rol-outfit/plans/reports/Explore-260614-1503-deployment-architecture.md`

## Decision

**Approved approach:** Tunnel → Nginx → Apps with separate Cloudflare account.
