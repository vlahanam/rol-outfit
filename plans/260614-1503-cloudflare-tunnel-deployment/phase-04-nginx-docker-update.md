---
phase: 4
title: "Nginx HTTP-Only + Docker Update"
status: pending
priority: P1
effort: "15m"
dependencies: [3]
---

# Phase 4: Nginx HTTP-Only + Docker Update

## Overview

Sau khi tunnel đã chạy stable với localhost:443, giờ đơn giản hóa:
1. Nginx: bỏ SSL, chỉ listen 80
2. Docker: bỏ port 443
3. Tunnel config: đổi target sang localhost:80

## Prerequisites

- ✅ Phase 3 passed: Tunnel service running stable
- ✅ Site accessible via tunnel

## Implementation Steps

### Step 1: Backup current configs

```bash
cp /home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf \
   /home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf.ssl-backup

cp /home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml \
   /home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml.ssl-backup
```

### Step 2: Update nginx config (HTTP only)

Replace `/home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf`:

```nginx
upstream backend {
    server backend:8080;
    keepalive 32;
}

upstream frontend {
    server frontend:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name roloutfit.io.vn www.roloutfit.io.vn;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Uploads
    location /uploads/ {
        alias /app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        client_max_body_size 10m;
    }

    # Frontend proxy
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_cache_bypass $http_upgrade;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
```

### Step 3: Update docker-compose.prod.yml

Edit nginx service in `/home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml`:

**Change FROM:**
```yaml
  nginx:
    ...
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ../nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - uploads:/app/uploads:ro
```

**Change TO:**
```yaml
  nginx:
    ...
    ports:
      - "80:80"
    volumes:
      - ../nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
      - uploads:/app/uploads:ro
```

### Step 4: Recreate nginx container

```bash
cd /home/ubuntu/longan/rol-outfit
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod up -d --force-recreate nginx
```

### Step 5: Verify nginx running

```bash
docker ps | grep nginx
docker logs rol-outfit-prod-nginx-1 --tail 10
```

### Step 6: Update tunnel config (target HTTP)

Edit `~/.cloudflared/config-roloutfit-prod.yml`:

**Change FROM:**
```yaml
ingress:
  - hostname: roloutfit.io.vn
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
```

**Change TO:**
```yaml
ingress:
  - hostname: roloutfit.io.vn
    service: http://localhost:80
  - hostname: www.roloutfit.io.vn
    service: http://localhost:80
  - service: http_status:404
```

### Step 7: Restart tunnel service

```bash
sudo systemctl restart cloudflared-roloutfit.service
```

### Step 8: Verify everything works

```bash
# Check tunnel
journalctl -u cloudflared-roloutfit.service --no-pager -n 20

# Check site
curl -I https://roloutfit.io.vn
curl https://roloutfit.io.vn/api/v1/products | head -c 200
```

## Success Criteria

- [ ] Nginx config updated (no SSL)
- [ ] Docker compose updated (no port 443)
- [ ] Nginx container recreated
- [ ] Tunnel config updated (http://localhost:80)
- [ ] Site accessible via HTTPS (Cloudflare SSL)
- [ ] API working

## Rollback

```bash
# Restore nginx config
cp /home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf.ssl-backup \
   /home/ubuntu/longan/rol-outfit/nginx/conf.d/production.conf

# Restore docker compose
cp /home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml.ssl-backup \
   /home/ubuntu/longan/rol-outfit/docker/docker-compose.prod.yml

# Recreate nginx with SSL
cd /home/ubuntu/longan/rol-outfit
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod up -d --force-recreate nginx

# Restore tunnel config to https://localhost:443
# Edit ~/.cloudflared/config-roloutfit-prod.yml

# Restart tunnel
sudo systemctl restart cloudflared-roloutfit.service
```

## Notes

- Backup files (.ssl-backup) giữ lại để rollback nếu cần
- Sau khi verify hoàn tất, có thể xóa backup files
