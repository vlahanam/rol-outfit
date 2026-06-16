---
phase: 4
title: Environment Setup and Deployment
status: completed
priority: P1
effort: 1h
dependencies:
  - 3
---

# Phase 4: Environment Setup and Deployment

## Overview

Setup environment variables, deploy stack, và verify all services hoạt động đúng.

## Requirements

- Production environment variables configured
- All containers running healthy
- Website accessible via HTTPS
- API responding correctly

## Related Code Files

- Create: `docker/.env.prod` (from example, not committed)
- Modify: `.gitignore` (add secrets exclusions)

## Implementation Steps

### Step 1: Update .gitignore

Add to root `.gitignore`:

```
# Production secrets
docker/.env.prod
nginx/ssl/*.pem
nginx/ssl/*.key
```

### Step 2: Create Production Environment File

```bash
cd docker
cp .env.prod.example .env.prod
```

Edit `.env.prod` with secure values:

```bash
# Generate secure password
openssl rand -base64 24

# Generate JWT secret
openssl rand -hex 32
```

### Step 3: Create SSL Directory and Add Certificates

```bash
mkdir -p nginx/ssl
# Copy Cloudflare Origin Certificate files here
# origin.pem and origin-key.pem
```

### Step 4: Build and Deploy

```bash
cd docker

# Build production images
docker compose -f docker-compose.prod.yml build

# Start services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 5: Verify Deployment

```bash
# Check all containers running
docker compose -f docker-compose.prod.yml ps

# Test backend health
curl -k https://localhost/api/v1/products

# Check Nginx logs
docker compose -f docker-compose.prod.yml logs nginx
```

### Step 6: Verify External Access

1. Open https://roloutfit.io.vn in browser
2. Check SSL certificate (should show Cloudflare)
3. Test API: https://roloutfit.io.vn/api/v1/products
4. Test uploads: https://roloutfit.io.vn/uploads/ (should return 404 if empty)

### Step 7: Setup Firewall (Optional but Recommended)

```bash
# Allow only Cloudflare IPs to port 443
# See: https://www.cloudflare.com/ips/
sudo ufw allow from 173.245.48.0/20 to any port 443
sudo ufw allow from 103.21.244.0/22 to any port 443
sudo ufw allow from 103.22.200.0/22 to any port 443
sudo ufw allow from 103.31.4.0/22 to any port 443
sudo ufw allow from 141.101.64.0/18 to any port 443
sudo ufw allow from 108.162.192.0/18 to any port 443
sudo ufw allow from 190.93.240.0/20 to any port 443
sudo ufw allow from 188.114.96.0/20 to any port 443
sudo ufw allow from 197.234.240.0/22 to any port 443
sudo ufw allow from 198.41.128.0/17 to any port 443
sudo ufw allow from 162.158.0.0/15 to any port 443
sudo ufw allow from 104.16.0.0/13 to any port 443
sudo ufw allow from 104.24.0.0/14 to any port 443
sudo ufw allow from 172.64.0.0/13 to any port 443
sudo ufw allow from 131.0.72.0/22 to any port 443

# Block other IPs from 443
sudo ufw deny 443

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Deployment Commands Summary

```bash
# Full deployment
cd /home/ubuntu/longan/rol-outfit/docker
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart single service
docker compose -f docker-compose.prod.yml restart backend

# Check status
docker compose -f docker-compose.prod.yml ps
```

## Success Criteria

- [ ] All 4 containers running (db, backend, frontend, nginx)
- [ ] https://roloutfit.io.vn loads frontend
- [ ] https://roloutfit.io.vn/api/v1/products returns JSON
- [ ] SSL certificate shows valid (green lock)
- [ ] No secrets in git repository
- [ ] Containers auto-restart after failure

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Nginx won't start | Check SSL cert paths, run `nginx -t` |
| Backend connection refused | Check DB healthcheck, view backend logs |
| Frontend 502 | Verify frontend container running, check logs |
| SSL invalid | Ensure Cloudflare proxy enabled (orange cloud) |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Deployment downtime | Build images before down, quick up |
| Data loss | Postgres uses named volume |
| Config errors | Test locally before production |
