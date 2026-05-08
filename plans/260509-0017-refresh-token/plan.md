---
title: Refresh Token Implementation
status: completed
priority: high
created: 2026-05-09
blockedBy: []
blocks: []
---

# Refresh Token Implementation

Stateful refresh token flow for Go/Fiber v3 backend + Next.js frontend. Replaces stateless 24h access token with short-lived (15min) access + DB-backed rotating refresh token (7d) with theft detection.

## Goals

- Add `/api/v1/auth/refresh` + `/api/v1/auth/logout` endpoints
- DB-stored SHA256 hashes (no Redis) for refresh tokens
- Single-use rotation + family invalidation on theft
- Frontend auto-retry on 401 with promise deduplication
- Multi-tab logout sync via BroadcastChannel
- Reduce access token TTL: 24h → 15min

## Phases

| # | Phase | Status | Effort | Owner |
|---|-------|--------|--------|-------|
| 01 | [Backend: DB Foundation](./phase-01-backend-db-foundation.md) | completed | 1.5h | backend |
| 02 | [Backend: Auth Service + Endpoints](./phase-02-backend-auth-service.md) | completed | 3h | backend |
| 03 | [Frontend Integration](./phase-03-frontend-integration.md) | completed | 2h | frontend |

## Dependencies

- Phase 02 depends on Phase 01 (repository must exist before service uses it)
- Phase 03 depends on Phase 02 (endpoints must exist before frontend calls them)

## Files Changed (Summary)

**Created:**
- `backend/database/migrations/000010_create_refresh_tokens.{up,down}.sql`
- `backend/src/internal/models/refresh_token.go`
- `backend/src/internal/repositories/refresh_token_repo.go`

**Modified (Backend):**
- `backend/src/internal/services/auth_service.go`
- `backend/src/internal/controllers/auth_controller.go`
- `backend/src/internal/requests/auth_request.go`
- `backend/src/internal/initialize/route.go`
- `backend/src/internal/initialize/run.go`
- `backend/src/internal/i18n/locales/{vi,ja}.json`

**Modified (Frontend):**
- `frontend/lib/auth.ts`
- `frontend/lib/api.ts`

## Rollback Strategy

- Phase 01: `migrate down` reverts schema; no data loss (table is new)
- Phase 02: Revert via git; restart backend (cleanup goroutine stops with process)
- Phase 03: Revert via git; existing tokens in localStorage remain valid until access token expires

## Success Criteria

- [x] `POST /api/v1/auth/refresh` returns new token pair with valid refresh token
- [x] Reuse of revoked refresh token invalidates entire family (theft detection works)
- [x] `POST /api/v1/auth/logout` revokes all user's refresh tokens
- [x] Frontend transparently retries on 401 with no user-visible failure
- [x] Concurrent 401s share single refresh request (no duplicate refreshes)
- [x] Logout in tab A logs out tab B within 1s (BroadcastChannel)
- [x] Cleanup goroutine deletes expired tokens every 6h
- [x] All existing tests pass + new tests for refresh/logout
