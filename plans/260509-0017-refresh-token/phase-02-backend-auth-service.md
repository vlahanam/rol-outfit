# Phase 02 — Backend: Auth Service + Endpoints

## Context Links

- Plan: [plan.md](./plan.md)
- Blocked by: [Phase 01](./phase-01-backend-db-foundation.md)
- Related: `backend/src/internal/services/auth_service.go`, `controllers/auth_controller.go`, `initialize/route.go`

## Overview

- **Priority:** high
- **Status:** completed
- **Description:** Wire refresh token repo into `authService`. Add `Refresh` and `Logout` methods + corresponding HTTP endpoints. Reduce access token TTL to 15min. Start cleanup goroutine on app boot.

## Key Insights

- **JWT for refresh token retains structure** (claims: `sub`, `jti`, `family_id`, `exp`) but DB hash is the source of truth — JWT signature alone is insufficient
- **Theft detection**: if a refresh token's hash maps to a row with `revoked_at IS NOT NULL`, attacker is using a leaked token → revoke entire family + return 401
- **Single-use rotation**: every successful refresh revokes old token AND issues new one (different `jti`, same `family_id`)
- **Logout**: revokes ALL user's active refresh tokens (signs them out everywhere) — derive `user_id` from refresh token JWT claims
- **Cleanup goroutine**: `time.NewTicker(6 * time.Hour)` + `select { case <-ctx.Done(): return; case <-ticker.C: repo.DeleteExpired(...) }`
- **Access token TTL**: 15min balances UX vs. security; refresh covers re-issuance

## Requirements

**Functional:**
- `Refresh(ctx, refreshTokenStr)` returns new `*models.AuthTokens` or error
- `Logout(ctx, refreshTokenStr)` revokes all user tokens; succeeds even if token already revoked (idempotent)
- `POST /api/v1/auth/refresh` — body: `{refresh_token}` → 200 with new tokens OR 401 with i18n error
- `POST /api/v1/auth/logout` — body: `{refresh_token}` → 204 No Content (always succeeds for valid signed token)
- Cleanup goroutine starts at boot, stops gracefully on shutdown

**Non-functional:**
- Refresh latency < 50ms (single DB query + UPDATE + INSERT)
- Cleanup batch limit: no `LIMIT` needed for now (volume low); revisit if table > 1M rows
- All error messages localized via existing `i18n` package

## Architecture

```
Refresh Flow:
  Client → POST /auth/refresh {refresh_token}
    → controller: parse + validate request
    → service.Refresh:
        1. Parse JWT (verify signature, exp)
        2. Hash token (SHA256)
        3. repo.FindByHash(hash)
            ├ not found      → 401 invalid
            ├ revoked_at set → repo.RevokeTokenFamily + 401 (theft!)
            └ active         → continue
        4. repo.RevokeRefreshToken(hash)        [revoke old]
        5. generateTokens(user, family_id)       [reuse family]
        6. repo.SaveRefreshToken(new_hash)       [persist new]
        7. return new pair

Logout Flow:
  Client → POST /auth/logout {refresh_token}
    → service.Logout:
        1. Parse JWT (best-effort: extract user_id from claims)
        2. repo.RevokeUserRefreshTokens(user_id)
        3. return nil (idempotent)

Cleanup Goroutine (in initialize/run.go):
  go func() {
    ticker := time.NewTicker(6 * time.Hour)
    for { select {
      case <-ctx.Done(): return
      case <-ticker.C: repo.DeleteExpiredRefreshTokens(ctx)
    } }
  }()
```

## Related Code Files

**Modify:**
- `backend/src/internal/services/auth_service.go` — interface + struct + methods, reduce access TTL
- `backend/src/internal/controllers/auth_controller.go` — add `Refresh`, `Logout` handlers
- `backend/src/internal/requests/auth_request.go` — add `RefreshRequest`
- `backend/src/internal/initialize/route.go` — register 2 new routes
- `backend/src/internal/initialize/run.go` — wire repo into `NewAuthService` + start cleanup goroutine
- `backend/src/internal/i18n/locales/vi.json`
- `backend/src/internal/i18n/locales/ja.json`

**Read for context:**
- Phase 01 outputs: `models/refresh_token.go`, `repositories/refresh_token_repo.go`
- `backend/src/internal/middleware/jwt_middleware.go` (claims structure)

## Implementation Steps

1. **Update `requests/auth_request.go`** — add `RefreshRequest{ RefreshToken string \`json:"refresh_token" validate:"required"\` }` with `Validate()` method matching existing pattern.
2. **Update `services/auth_service.go`:**
   - Extend `AuthService` interface with `Refresh` + `Logout`
   - Add `refreshTokenRepo repositories.RefreshTokenRepository` field to `authService` struct
   - Update `NewAuthService(...)` constructor signature
   - Define `accessTokenTTL = 15 * time.Minute` constant
   - Define `refreshTokenTTL = 7 * 24 * time.Hour` constant
   - Refactor `generateTokens(user, familyID *string)` — if `familyID` nil, generate new UUID; add `jti` (UUID) + `family_id` claims to refresh token; SHA256 the signed string; persist via `repo.SaveRefreshToken`
   - Update `Login` + `Register` to call `generateTokens(user, nil)` (new family per login)
   - Implement `Refresh`: parse JWT (use existing JWT secret), extract `family_id`, hash token, `FindByHash`. If revoked → `RevokeTokenFamily` + return i18n `error.token_family_revoked`. Else → `RevokeRefreshToken(hash)` → `generateTokens(user, &familyID)`.
   - Implement `Logout`: parse JWT, extract `sub` (user_id), call `RevokeUserRefreshTokens`. Treat parse errors as success (idempotent for malformed tokens to prevent enumeration).
3. **Update `controllers/auth_controller.go`:**
   - `Refresh(c fiber.Ctx)`: parse `RefreshRequest` → validate → call `service.Refresh` → return `200 {tokens}` or i18n error
   - `Logout(c fiber.Ctx)`: parse `RefreshRequest` → call `service.Logout` → return `204`
4. **Update `initialize/route.go`** — add inside auth group:
   - `auth.Post("/refresh", authCtrl.Refresh)`
   - `auth.Post("/logout", authCtrl.Logout)`
5. **Update `initialize/run.go`:**
   - Instantiate `refreshTokenRepo := repositories.NewRefreshTokenRepository(db)`
   - Pass into `NewAuthService(userRepo, refreshTokenRepo, ...)`
   - Spawn cleanup goroutine bound to app lifecycle context
6. **Update i18n files** — add to `vi.json` and `ja.json`:
   - `error.refresh_token_invalid`
   - `error.refresh_token_expired`
   - `error.token_family_revoked`
   - `validation.refresh_token.required`
7. **Compile check** — `cd backend && go build ./...` and `go vet ./...`.
8. **Manual test** — login → call refresh → verify new tokens differ → reuse old refresh → expect 401 + family revoked → re-login → logout → refresh again → expect 401.

## Todo List

- [x] Add `RefreshRequest` struct + validation
- [x] Extend `AuthService` interface (Refresh, Logout)
- [x] Add `refreshTokenRepo` field + update constructor
- [x] Reduce access TTL to 15min
- [x] Refactor `generateTokens` with `family_id` + `jti` + DB persist
- [x] Implement `Refresh` with theft detection
- [x] Implement `Logout` (revoke all user tokens)
- [x] Add controller handlers
- [x] Register routes
- [x] Wire DI in `run.go` + start cleanup goroutine
- [x] Add i18n keys (vi + ja)
- [x] `go build` + `go vet` pass
- [x] Manual flow test passes

## Success Criteria

- Refresh returns new pair; old refresh token rejected on second use
- Reuse of revoked token → entire family revoked (verify in DB: `SELECT * FROM refresh_tokens WHERE token_family=...` shows all `revoked_at IS NOT NULL`)
- Logout revokes all user's active tokens
- Access tokens expire in 15min (verify `exp` claim)
- Cleanup goroutine logs activity at boot + every 6h
- All i18n keys resolve in both locales

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TTL reduction breaks existing sessions | High | Users logged out | Document migration; users re-login (acceptable for pre-prod) |
| Cleanup goroutine leaks on shutdown | Med | Memory growth | Bind ticker to app context; use `select` on `ctx.Done()` |
| Race: concurrent refresh of same token | Low | Double-spend | DB UPDATE on `WHERE revoked_at IS NULL` is atomic; second wins gets 401 |
| JWT secret leak | Critical | Forge tokens | Out of scope — existing risk, not introduced here |
| Malformed token DOSes Logout | Low | Resource use | Logout swallows parse errors silently |

## Security Considerations

- Refresh tokens stored as SHA256 hashes only — DB compromise does not yield valid tokens
- Single-use rotation prevents replay
- Family invalidation detects stolen tokens (defense in depth)
- Logout always returns 204 to prevent token-validity enumeration via timing/error differential
- Access TTL reduction (24h → 15min) reduces blast radius of leaked access token by 96x
- New `jti` per token enables future token-revocation extensions

## Next Steps

- Phase 03: frontend consumes `/refresh` + `/logout` endpoints
- Future: consider IP/user-agent fingerprinting for additional theft signals
- Future: rate-limit `/refresh` endpoint (e.g., 10/min per IP)
