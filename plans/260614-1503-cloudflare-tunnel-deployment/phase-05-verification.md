---
phase: 5
title: "Verification & Cleanup"
status: pending
priority: P1
effort: "10m"
dependencies: [4]
---

# Phase 5: Verification & Cleanup

## Overview

Verify deployment hoàn tất, configure Cloudflare settings, cleanup old configs.

## Requirements

- Functional: Site accessible via HTTPS, API works
- Non-functional: SSL A+ rating, caching enabled

## Implementation Steps

### Step 1: Verify frontend loads

```bash
curl -I https://roloutfit.io.vn
```

**Expected:** HTTP 200 with HTML content

### Step 2: Verify API works

```bash
curl https://roloutfit.io.vn/api/v1/health
# or
curl https://roloutfit.io.vn/api/v1/products
```

**Expected:** JSON response

### Step 3: Verify www subdomain

```bash
curl -I https://www.roloutfit.io.vn
```

**Expected:** HTTP 200 or 301 redirect to non-www

### Step 4: Verify uploads accessible

```bash
# If there are uploads
curl -I https://roloutfit.io.vn/uploads/
```

### Step 5: Configure Cloudflare SSL/TLS

In Cloudflare Dashboard → SSL/TLS:

1. **SSL/TLS encryption mode:** Full (strict)
2. **Always Use HTTPS:** On
3. **Automatic HTTPS Rewrites:** On
4. **Minimum TLS Version:** 1.2

### Step 6: Configure Cloudflare Security

In Cloudflare Dashboard → Security:

1. **Security Level:** Medium
2. **Bot Fight Mode:** On (if available)
3. **Browser Integrity Check:** On

### Step 7: Configure Cloudflare Caching

In Cloudflare Dashboard → Caching:

1. **Caching Level:** Standard
2. **Browser Cache TTL:** 4 hours
3. **Always Online:** On

### Step 8: Configure Page Rules (Optional)

Create page rule for /api/* (if needed):
- **URL:** `roloutfit.io.vn/api/*`
- **Settings:**
  - Cache Level: Bypass
  - Browser Cache TTL: Bypass

### Step 9: Cleanup old tunnel config

After verifying everything works:

```bash
# Remove old config (from wrong account)
rm ~/.cloudflared/config-roloutfit.yml

# Optionally delete old tunnel (requires techcoffee account)
# TUNNEL_ORIGIN_CERT=~/.cloudflared/cert-techcoffee.pem \
# cloudflared tunnel delete de27ac9d-137f-4fdb-99fb-06b15acfedef
```

## Success Criteria

- [ ] https://roloutfit.io.vn returns 200
- [ ] https://roloutfit.io.vn/api/ returns JSON
- [ ] https://www.roloutfit.io.vn works
- [ ] SSL/TLS set to Full (strict)
- [ ] Always Use HTTPS enabled
- [ ] techcoffee.cloud still works (no impact)

## Verification Checklist

| Test | Command | Expected |
|------|---------|----------|
| Frontend | `curl -I https://roloutfit.io.vn` | 200 OK |
| API | `curl https://roloutfit.io.vn/api/v1/health` | JSON |
| WWW | `curl -I https://www.roloutfit.io.vn` | 200/301 |
| SSL | Browser padlock | Green lock |
| Other tunnels | `curl https://techcoffee.cloud` | Still works |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Cloudflare settings break site | Test after each change |
| Aggressive caching breaks API | Add cache bypass rule for /api/* |
| Old tunnel interferes | Delete after new one verified |

### Step 10: Cleanup backup files (optional, after stable)

Sau khi chạy stable 24h+:

```bash
# Remove backup files
rm /home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf.ssl-backup
rm /home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml.ssl-backup

# Remove old tunnel config
rm ~/.cloudflared/config-roloutfit.yml
```

## Post-Deployment

1. Monitor tunnel: `journalctl -u cloudflared-roloutfit.service -f`
2. Check Cloudflare Analytics for traffic
3. Set up Cloudflare notifications for tunnel health
4. Verify techcoffee.cloud still works: `curl https://techcoffee.cloud`
