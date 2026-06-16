---
title: Cloudflare Tunnel Deployment for roloutfit.io.vn
description: >-
  Deploy rol-outfit via Cloudflare Tunnel với tài khoản riêng, 
  không ảnh hưởng đến các tunnel hiện có (techcoffee, bctg-agent)
status: pending
priority: P1
branch: develop
tags:
  - deployment
  - cloudflare
  - tunnel
  - systemd
blockedBy: []
blocks: []
supersedes: 260608-1444-cloudflare-deployment
created: '2026-06-14T15:03:00.000Z'
createdBy: 'ck:plan'
source: skill
---

# Cloudflare Tunnel Deployment for roloutfit.io.vn

## Overview

Deploy rol-outfit full-stack application via **Cloudflare Tunnel** với:
- **Domain:** roloutfit.io.vn + www
- **Architecture:** Tunnel → Nginx (HTTP) → Apps
- **Account:** Cloudflare riêng (không ảnh hưởng techcoffee)
- **SSL:** Cloudflare Full (Strict) - no SSL at nginx

## Architecture

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
│  cloudflared (systemd) → nginx:80 → backend:8080            │
│                                    → frontend:3000           │
│                                    → /uploads (static)       │
└─────────────────────────────────────────────────────────────┘
```

## Phases (Safe Order)

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Cloudflare Account & Tunnel Setup](./phase-01-cloudflare-tunnel-setup.md) | Pending | 15m |
| 2 | [Test Tunnel với SSL hiện tại](./phase-02-test-tunnel-ssl.md) | Pending | 10m |
| 3 | [Systemd Service](./phase-03-systemd-service.md) | Pending | 10m |
| 4 | [Nginx HTTP-Only + Docker Update](./phase-04-nginx-docker-update.md) | Pending | 15m |
| 5 | [Verification & Cleanup](./phase-05-verification.md) | Pending | 10m |

**Total Effort:** ~60m

### Safe Execution Flow

```
Phase 1: Login + Create tunnel
    ↓
Phase 2: Test tunnel → localhost:443 (KHÔNG thay đổi nginx)
    ↓ ✅ Tunnel works?
Phase 3: Create systemd service (tunnel vẫn dùng localhost:443)
    ↓ ✅ Service stable?
Phase 4: Sửa nginx (HTTP only) + Docker (bỏ port 443)
    ↓ ✅ Site works?
Phase 5: Verify all + Cleanup old config
```

**Rollback tại bất kỳ phase nào:** Tunnel có thể quay về localhost:443 ngay lập tức.

## Key Changes from Current Setup

| Component | Current | Target |
|-----------|---------|--------|
| SSL termination | Nginx (Origin cert) | Cloudflare |
| Nginx listen | 443 + 80 redirect | 80 only |
| Tunnel target | https://localhost:443 | http://localhost:80 |
| Account | techcoffee | **roloutfit (separate)** |
| Service | Manual/none | **systemd auto-start** |

## Files to Create

| File | Purpose |
|------|---------|
| `~/.cloudflared/cert-roloutfit.pem` | Cloudflare origin cert (via login) |
| `~/.cloudflared/{uuid}.json` | Tunnel credentials |
| `~/.cloudflared/config-roloutfit-prod.yml` | Tunnel config |
| `/etc/systemd/system/cloudflared-roloutfit.service` | Systemd service |

## Files to Modify

| File | Change |
|------|--------|
| `nginx/conf.d/production.conf` | Remove SSL, listen 80 only |
| `docker/docker-compose.prod.yml` | Remove port 443, keep 80 |

## Prerequisites

- ✅ Docker containers running (backend, frontend, nginx, db)
- ✅ Domain roloutfit.io.vn on Cloudflare
- ⚠️ cloudflared installed at `~/.local/bin/cloudflared`
- ⚠️ Access to separate Cloudflare account credentials

## Success Criteria

- [ ] https://roloutfit.io.vn loads frontend
- [ ] https://roloutfit.io.vn/api/ returns backend response
- [ ] www.roloutfit.io.vn redirects/works
- [ ] Tunnel runs as systemd service
- [ ] Service auto-restarts on failure/reboot
- [ ] No impact on techcoffee.cloud tunnel

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Old tunnel conflict | Delete old tunnel config after new one works |
| Account credential mix | Use explicit `--origincert` flag |
| Downtime | Keep old setup running until new verified |

## Context

- Brainstorm: `plans/reports/brainstorm-260614-1503-cloudflare-deployment.md`
- Deployment report: `plans/reports/Explore-260614-1503-deployment-architecture.md`
- Reference: `/home/ubuntu/tools/cloudflared/cloudflared-techcoffee.yml`
