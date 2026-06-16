---
phase: 2
title: "Test Tunnel với SSL hiện tại"
status: pending
priority: P1
effort: "10m"
dependencies: [1]
---

# Phase 2: Test Tunnel với SSL hiện tại

## Overview

Test tunnel mới với cấu hình hiện tại (localhost:443) TRƯỚC khi thay đổi nginx.
Đảm bảo tunnel hoạt động trước khi làm bất kỳ thay đổi nào.

## Requirements

- Functional: Tunnel kết nối thành công, domain accessible
- Non-functional: **KHÔNG thay đổi nginx/docker** - chỉ test

## Why This Phase?

```
✅ AN TOÀN: Test tunnel → Nếu fail → nginx vẫn chạy SSL như cũ
❌ RỦI RO: Sửa nginx trước → Nếu tunnel fail → site không accessible
```

## Implementation Steps

### Step 1: Stop old tunnel process

```bash
# Tìm và kill old rol-outfit tunnel
ps aux | grep "config-roloutfit.yml" | grep -v grep
# Output: ubuntu 2486046 ... cloudflared tunnel --config ...

# Kill nó
kill 2486046  # hoặc PID từ output trên
```

### Step 2: Create temporary config (target SSL)

Tạo file `~/.cloudflared/config-roloutfit-prod.yml` (dùng UUID từ Phase 1):

```yaml
tunnel: {UUID_FROM_PHASE_1}
credentials-file: /home/ubuntu/.cloudflared/{UUID_FROM_PHASE_1}.json
origincert: /home/ubuntu/.cloudflared/cert-roloutfit.pem

ingress:
  - hostname: roloutfit.io.vn
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - hostname: www.roloutfit.io.vn
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

**Note:** `noTLSVerify: true` vì đang dùng self-signed/origin cert

### Step 3: Test tunnel manually

```bash
TUNNEL_ORIGIN_CERT=/home/ubuntu/.cloudflared/cert-roloutfit.pem \
/home/ubuntu/.local/bin/cloudflared tunnel \
  --config /home/ubuntu/.cloudflared/config-roloutfit-prod.yml \
  run
```

**Chạy ở terminal riêng, để logs visible**

### Step 4: Verify tunnel connections

Trong logs, tìm:
```
INF Registered tunnel connection connIndex=0 ...
INF Registered tunnel connection connIndex=1 ...
```

### Step 5: Test domain access

```bash
# Mở terminal khác
curl -I https://roloutfit.io.vn
```

**Expected:** HTTP 200 (hoặc 301 redirect)

### Step 6: Test API

```bash
curl https://roloutfit.io.vn/api/v1/health
# hoặc
curl https://roloutfit.io.vn/api/v1/products
```

**Expected:** JSON response

### Step 7: Verification checkpoint

| Test | Expected | Actual |
|------|----------|--------|
| Tunnel logs | "Registered tunnel connection" | |
| curl domain | 200 OK | |
| curl API | JSON | |
| techcoffee.cloud | Still works | |

## Success Criteria

- [ ] Old tunnel process killed
- [ ] New tunnel config created
- [ ] Tunnel connects (logs show connections)
- [ ] https://roloutfit.io.vn returns 200
- [ ] API accessible
- [ ] techcoffee.cloud unaffected

## Rollback

Nếu tunnel fail:
```bash
# Ctrl+C để stop tunnel test
# Site vẫn accessible qua localhost:443 (nếu có direct access)
# Không cần rollback gì vì chưa thay đổi nginx
```

## Next Phase Gate

**CHỈ tiếp tục Phase 3 NẾU:**
- [ ] Tunnel test thành công
- [ ] Domain accessible qua tunnel
- [ ] API hoạt động

**NẾU FAIL:** Debug tunnel trước, KHÔNG tiếp tục sửa nginx.
