---
phase: 1
title: "Cloudflare Account & Tunnel Setup"
status: pending
priority: P1
effort: "15m"
dependencies: []
---

# Phase 1: Cloudflare Account & Tunnel Setup

## Overview

Login to separate Cloudflare account và tạo tunnel mới cho rol-outfit. Tunnel này hoàn toàn độc lập với các tunnel hiện có (techcoffee, bctg-agent).

## Requirements

- Functional: Tunnel created và credentials saved
- Non-functional: Không ảnh hưởng tunnels khác

## Architecture

```
User → cloudflared login → Cloudflare Auth → cert-roloutfit.pem
     → cloudflared tunnel create → {uuid}.json
     → cloudflared tunnel route dns → DNS CNAME records
```

## Implementation Steps

### Step 1: Login to Cloudflare (INTERACTIVE)

```bash
# This is INTERACTIVE - user must run manually
/home/ubuntu/.local/bin/cloudflared login
```

**Quan trọng:**
1. Browser sẽ mở tự động
2. Login vào tài khoản Cloudflare **cho roloutfit.io.vn** (KHÔNG phải techcoffee)
3. Chọn domain **roloutfit.io.vn**
4. Cert sẽ được lưu tại `~/.cloudflared/cert.pem`

### Step 2: Rename cert file

```bash
mv ~/.cloudflared/cert.pem ~/.cloudflared/cert-roloutfit.pem
```

### Step 3: Create tunnel

```bash
TUNNEL_ORIGIN_CERT=~/.cloudflared/cert-roloutfit.pem \
/home/ubuntu/.local/bin/cloudflared tunnel create rol-outfit-prod
```

**Output example:**
```
Tunnel credentials written to /home/ubuntu/.cloudflared/{uuid}.json
Created tunnel rol-outfit-prod with id {uuid}
```

**Ghi lại UUID** cho các bước tiếp theo.

### Step 4: Create tunnel config

Tạo file `~/.cloudflared/config-roloutfit-prod.yml`:

```yaml
tunnel: {UUID_FROM_STEP_3}
credentials-file: /home/ubuntu/.cloudflared/{UUID_FROM_STEP_3}.json
origincert: /home/ubuntu/.cloudflared/cert-roloutfit.pem

ingress:
  - hostname: roloutfit.io.vn
    service: http://localhost:80
  - hostname: www.roloutfit.io.vn
    service: http://localhost:80
  - service: http_status:404
```

### Step 5: Route DNS

```bash
TUNNEL_ORIGIN_CERT=~/.cloudflared/cert-roloutfit.pem \
/home/ubuntu/.local/bin/cloudflared tunnel route dns rol-outfit-prod roloutfit.io.vn

TUNNEL_ORIGIN_CERT=~/.cloudflared/cert-roloutfit.pem \
/home/ubuntu/.local/bin/cloudflared tunnel route dns rol-outfit-prod www.roloutfit.io.vn
```

### Step 6: Verify DNS records in Cloudflare Dashboard

Check that CNAME records were created:
- `roloutfit.io.vn` → `{uuid}.cfargotunnel.com`
- `www.roloutfit.io.vn` → `{uuid}.cfargotunnel.com`

## Related Code Files

- Create: `~/.cloudflared/cert-roloutfit.pem`
- Create: `~/.cloudflared/{uuid}.json`
- Create: `~/.cloudflared/config-roloutfit-prod.yml`

## Success Criteria

- [ ] cert-roloutfit.pem exists
- [ ] Tunnel credentials JSON exists
- [ ] config-roloutfit-prod.yml created
- [ ] DNS CNAME records visible in Cloudflare

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Login to wrong account | Double-check domain selection in browser |
| Overwrite existing cert.pem | Rename immediately after login |
| DNS propagation delay | Wait 5 minutes before testing |

## Notes

- `TUNNEL_ORIGIN_CERT` env var ensures we use the correct certificate
- Tunnel ID (UUID) is needed for config file and systemd service
