---
phase: 3
title: Nginx SSL Configuration
status: completed
priority: P1
effort: 30m
dependencies:
  - 2
---

# Phase 3: Nginx SSL Configuration

## Overview

Tạo Nginx config với SSL/HTTPS sử dụng Cloudflare Origin Certificate, security headers, và gzip compression.

## Requirements

- HTTPS on port 443 với Cloudflare Origin Certificate
- HTTP to HTTPS redirect on port 80
- Security headers (HSTS, X-Frame-Options, CSP)
- Gzip compression
- Proper proxy headers

## Related Code Files

- Create: `nginx/conf.d/production.conf`
- Create: `nginx/ssl/` directory (manual)

## Implementation Steps

### Step 1: Create SSL Directory

```bash
mkdir -p nginx/ssl
```

### Step 2: Generate Cloudflare Origin Certificate (Manual)

1. Login to Cloudflare Dashboard
2. Go to SSL/TLS → Origin Server
3. Click "Create Certificate"
4. Choose:
   - Private key type: RSA (2048)
   - Hostnames: `roloutfit.io.vn`, `*.roloutfit.io.vn`
   - Certificate validity: 15 years
5. Save files:
   - Certificate → `nginx/ssl/origin.pem`
   - Private Key → `nginx/ssl/origin-key.pem`

### Step 3: Create production.conf

Create `nginx/conf.d/production.conf`:

```nginx
upstream backend {
    server backend:8080;
    keepalive 32;
}

upstream frontend {
    server frontend:3000;
    keepalive 32;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name roloutfit.io.vn;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name roloutfit.io.vn;

    # SSL certificates (Cloudflare Origin)
    ssl_certificate /etc/nginx/ssl/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/origin-key.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

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

    # Uploads (static files)
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

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
```

### Step 4: Verify Cloudflare SSL Mode

1. In Cloudflare Dashboard → SSL/TLS
2. Set mode to "Full (strict)"
3. Ensure "Always Use HTTPS" is ON

## Success Criteria

- [ ] `nginx/ssl/origin.pem` and `nginx/ssl/origin-key.pem` exist
- [ ] Nginx config syntax valid: `docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:1.27-alpine nginx -t`
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present in response
- [ ] Gzip enabled for text content

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SSL cert files committed to git | .gitignore patterns |
| Wrong cert format | Follow Cloudflare PEM format exactly |
| Nginx fails to start | Test config before deployment |
