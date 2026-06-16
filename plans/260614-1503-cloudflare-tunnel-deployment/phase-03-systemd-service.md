---
phase: 3
title: "Systemd Service"
status: pending
priority: P1
effort: "10m"
dependencies: [2]
---

# Phase 3: Systemd Service

## Overview

Tạo systemd service để tunnel auto-start. Vẫn dùng config localhost:443 (chưa đổi nginx).

## Prerequisites

- ✅ Phase 2 passed: Tunnel test thành công
- Config file: `~/.cloudflared/config-roloutfit-prod.yml`

## Implementation Steps

### Step 1: Stop manual tunnel (nếu đang chạy)

```bash
# Ctrl+C trong terminal đang chạy tunnel test
# hoặc
pkill -f "config-roloutfit-prod.yml"
```

### Step 2: Create systemd service file

```bash
sudo tee /etc/systemd/system/cloudflared-roloutfit.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel - RolOutfit Production
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
Environment="TUNNEL_ORIGIN_CERT=/home/ubuntu/.cloudflared/cert-roloutfit.pem"
ExecStart=/home/ubuntu/.local/bin/cloudflared tunnel --config /home/ubuntu/.cloudflared/config-roloutfit-prod.yml run
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### Step 3: Reload systemd

```bash
sudo systemctl daemon-reload
```

### Step 4: Enable service (auto-start on boot)

```bash
sudo systemctl enable cloudflared-roloutfit.service
```

### Step 5: Start service

```bash
sudo systemctl start cloudflared-roloutfit.service
```

### Step 6: Check status

```bash
sudo systemctl status cloudflared-roloutfit.service
```

**Expected:**
```
● cloudflared-roloutfit.service - Cloudflare Tunnel - RolOutfit Production
     Loaded: loaded (/etc/systemd/system/cloudflared-roloutfit.service; enabled)
     Active: active (running) since ...
```

### Step 7: View logs

```bash
journalctl -u cloudflared-roloutfit.service -f --no-pager
```

**Expected:** "Registered tunnel connection" messages

### Step 8: Verify site still works

```bash
curl -I https://roloutfit.io.vn
curl https://roloutfit.io.vn/api/v1/products | head -c 200
```

## Success Criteria

- [ ] Service file created
- [ ] Service enabled (auto-start)
- [ ] Service running (active)
- [ ] Tunnel connections in logs
- [ ] Site accessible via HTTPS

## Rollback

```bash
sudo systemctl stop cloudflared-roloutfit.service
sudo systemctl disable cloudflared-roloutfit.service
sudo rm /etc/systemd/system/cloudflared-roloutfit.service
sudo systemctl daemon-reload
```

## Next Phase Gate

**CHỈ tiếp tục Phase 4 NẾU:**
- [ ] Service running stable (5+ minutes)
- [ ] Site accessible
- [ ] No errors in logs
