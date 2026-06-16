---
phase: 1
title: Production Dockerfiles
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: Production Dockerfiles

## Overview

Tạo multi-stage production Dockerfiles cho backend (Go) và frontend (Next.js) để build optimized images không có dev tools.

## Requirements

- Backend image: ~15MB (Go binary + Alpine)
- Frontend image: ~100MB (Next.js standalone)
- No source code in final image
- No dev dependencies (air, devDependencies)

## Related Code Files

- Create: `backend/Dockerfile.prod`
- Create: `frontend/Dockerfile.prod`
- Modify: `frontend/next.config.ts` (add standalone output)

## Implementation Steps

### Step 1: Create Backend Dockerfile.prod

Create `backend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /build

# Install git for private deps (if needed)
RUN apk add --no-cache git

# Copy go mod files first (cache layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./src/cmd/main.go

# Runtime stage
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates for HTTPS calls
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /build/server .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Run binary
CMD ["./server"]
```

### Step 2: Update Next.js Config for Standalone

Modify `frontend/next.config.ts` to add standalone output:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // ADD THIS LINE
  images: {
    remotePatterns: [],
  },
  // ... rest of config
};
```

### Step 3: Create Frontend Dockerfile.prod

Create `frontend/Dockerfile.prod`:

```dockerfile
# Dependencies stage
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production=false

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

## Success Criteria

- [ ] `docker build -f backend/Dockerfile.prod -t rol-backend:prod ./backend` succeeds
- [ ] `docker build -f frontend/Dockerfile.prod -t rol-frontend:prod ./frontend` succeeds
- [ ] Backend image size < 30MB
- [ ] Frontend image size < 200MB
- [ ] No `air` or `npm run dev` in production images

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Build fails due to missing deps | Test build locally before compose |
| Large image size | Use multi-stage, remove dev deps |
| Next.js standalone issues | Verify next.config.ts has `output: 'standalone'` |
