---
phase: 1
title: Dockerfiles — Backend & Frontend
status: completed
priority: high
---

# Phase 1: Dockerfiles — Backend & Frontend

## Context Links
- Plan: [plan.md](./plan.md)
- Go module: `backend/go.mod` (Fiber v3, Go 1.26)
- Backend entry: `backend/src/cmd/main.go`

## Overview

Create dev Dockerfiles and Air config for hot reload on both services.

## Backend — `backend/Dockerfile.dev`

```dockerfile
FROM golang:1.26-alpine

RUN apk add --no-cache git && \
    go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

# Source mounted at runtime via volume
CMD ["air", "-c", ".air.toml"]
```

## Backend — `backend/.air.toml`

```toml
root = "."
tmp_dir = "/tmp/air"

[build]
  cmd = "go build -o /tmp/air/server ./src/cmd/main.go"
  bin = "/tmp/air/server"
  include_ext = ["go"]
  exclude_dir = ["vendor", "testdata"]
  delay = 1000

[log]
  time = false

[color]
  main = "yellow"
  watcher = "cyan"
  build = "green"
  runner = "magenta"
```

**Note:** `tmp_dir` uses `/tmp/air` to avoid writing build artifacts into the volume-mounted source.

## Frontend — `frontend/Dockerfile.dev`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Source mounted at runtime via volume
CMD ["npm", "run", "dev"]
```

**Note:** `node_modules` is NOT volume-mounted — it stays inside the container. Add `node_modules` to `.dockerignore`.

## Files to Create

| File | Action |
|------|--------|
| `backend/Dockerfile.dev` | Create |
| `backend/.air.toml` | Create |
| `frontend/Dockerfile.dev` | Create |
| `frontend/.dockerignore` | Create (exclude `node_modules`, `.next`) |
| `backend/.dockerignore` | Create (exclude `vendor`, `tmp`) |

## Implementation Steps

1. Create `backend/Dockerfile.dev` per spec above
2. Create `backend/.air.toml` per spec above
3. Create `backend/.dockerignore`:
   ```
   vendor/
   tmp/
   *.exe
   ```
4. Create `frontend/Dockerfile.dev` per spec above
5. Create `frontend/.dockerignore`:
   ```
   node_modules/
   .next/
   .env*.local
   ```

## Todo

- [ ] Create `backend/Dockerfile.dev`
- [ ] Create `backend/.air.toml`
- [ ] Create `backend/.dockerignore`
- [ ] Create `frontend/Dockerfile.dev`
- [ ] Create `frontend/.dockerignore`

## Success Criteria

- `docker build -f backend/Dockerfile.dev backend/` completes without error
- `docker build -f frontend/Dockerfile.dev frontend/` completes without error (requires Next.js app to exist)

## Risk Assessment

- **Go 1.26 image availability**: Use `golang:1.26-alpine`; if unavailable fallback to `golang:1.25-alpine`
- **Air version**: Pin latest stable via `@latest` — acceptable for dev tools
- **Next.js not yet initialized**: Frontend Dockerfile requires `package.json` — Next.js app must be bootstrapped first (or create a minimal placeholder)
