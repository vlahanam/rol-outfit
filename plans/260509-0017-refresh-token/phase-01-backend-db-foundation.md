# Phase 01 — Backend: DB Foundation

## Context Links

- Plan: [plan.md](./plan.md)
- Related: `backend/src/internal/repositories/gorm.go` (`postgreStorage` struct pattern)
- Migration dir: `backend/database/migrations/`
- Reference repo: `backend/src/internal/repositories/user_repo.go`

## Overview

- **Priority:** high
- **Status:** completed
- **Description:** Create DB schema, model, and repository for stateful refresh token storage. Foundation for Phase 02 service logic.

## Key Insights

- Store SHA256 hash of refresh token, not the JWT itself (compromise of DB ≠ compromise of valid tokens)
- `token_family` (UUID) groups all rotations from one login — used for theft detection: reusing a revoked token in family revokes the entire family
- `revoked_at` is nullable timestamp (NULL = active) — preserves audit trail vs. hard delete
- Index `token_hash` (UNIQUE) for fast lookup; index `(user_id, revoked_at)` for logout queries; index `expires_at` for cleanup
- All repos in this project follow `postgreStorage` struct pattern (see `gorm.go`)

## Requirements

**Functional:**
- Schema supports: insert, find-by-hash, revoke-by-hash, revoke-by-family, revoke-by-user, delete-expired
- `token_hash` UNIQUE constraint prevents duplicate hash collisions
- FK to `users(id)` with `ON DELETE CASCADE`

**Non-functional:**
- Lookups by `token_hash` must be O(log n) (indexed)
- Cleanup query (`DELETE WHERE expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - 30 days)`) batch-friendly

## Architecture

```
┌─────────────────────────────────────────┐
│ refresh_tokens                          │
├─────────────────────────────────────────┤
│ id            UUID PK                   │
│ user_id       UUID FK → users(id)       │
│ token_hash    VARCHAR(64) UNIQUE NOT NULL│
│ token_family  UUID NOT NULL              │
│ expires_at    TIMESTAMPTZ NOT NULL       │
│ revoked_at    TIMESTAMPTZ NULL           │
│ created_at    TIMESTAMPTZ NOT NULL       │
└─────────────────────────────────────────┘
Indexes: token_hash (unique), (user_id, revoked_at), token_family, expires_at
```

## Related Code Files

**Create:**
- `backend/database/migrations/000010_create_refresh_tokens.up.sql`
- `backend/database/migrations/000010_create_refresh_tokens.down.sql`
- `backend/src/internal/models/refresh_token.go`
- `backend/src/internal/repositories/refresh_token_repo.go`

**Read for context:**
- `backend/src/internal/repositories/gorm.go`
- `backend/src/internal/repositories/user_repo.go` (pattern reference)
- `backend/src/internal/models/user.go`

## Implementation Steps

1. **Create migration up SQL** — `CREATE TABLE refresh_tokens` with columns above, all indexes, FK with `ON DELETE CASCADE`. Use `gen_random_uuid()` for default ID.
2. **Create migration down SQL** — `DROP TABLE IF EXISTS refresh_tokens`.
3. **Create `models/refresh_token.go`** — Go struct with GORM tags matching schema. Fields: `ID`, `UserID`, `TokenHash`, `TokenFamily`, `ExpiresAt`, `RevokedAt *time.Time`, `CreatedAt`. Add `TableName()` returning `"refresh_tokens"`.
4. **Create `repositories/refresh_token_repo.go`:**
   - Define `RefreshTokenRepository` interface with all 6 methods
   - Implement methods on `postgreStorage` (same struct used by other repos)
   - `SaveRefreshToken`: `db.WithContext(ctx).Create(token)`
   - `FindRefreshTokenByHash`: `db.WithContext(ctx).Where("token_hash = ?", hash).First(&t)`; return `gorm.ErrRecordNotFound` as not-found
   - `RevokeRefreshToken`: `UPDATE ... SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL`
   - `RevokeTokenFamily`: `UPDATE ... SET revoked_at = NOW() WHERE token_family = ? AND revoked_at IS NULL`
   - `RevokeUserRefreshTokens`: `UPDATE ... SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`
   - `DeleteExpiredRefreshTokens`: `DELETE WHERE expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')`
5. **Run migration locally** — `make up` then verify table via `make db-shell` → `\d refresh_tokens`.
6. **Compile check** — `cd backend && go build ./...`.

## Todo List

- [x] Write `000010_create_refresh_tokens.up.sql`
- [x] Write `000010_create_refresh_tokens.down.sql`
- [x] Create `models/refresh_token.go` with GORM tags
- [x] Define `RefreshTokenRepository` interface
- [x] Implement 6 methods on `postgreStorage`
- [x] Apply migration in dev DB
- [x] Verify `\d refresh_tokens` shows expected schema + indexes
- [x] `go build ./...` passes

## Success Criteria

- Migration up + down run cleanly without errors
- `\d refresh_tokens` shows 4 indexes (PK, token_hash unique, user_id+revoked_at, token_family, expires_at)
- All repo methods compile + interface satisfied
- FK cascade verified: deleting user removes related refresh tokens

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hash collision (SHA256) | Negligible | Token mixup | UNIQUE constraint causes insert error → caller regenerates |
| Index bloat over time | Med | Slow lookups | Cleanup goroutine in Phase 02 deletes old rows |
| FK cascade cascades unintentionally | Low | Lost tokens on user delete | Intentional — orphan tokens are useless anyway |

## Security Considerations

- Store only SHA256 hash, never plaintext token
- `token_hash` indexed but UNIQUE prevents enumeration timing attacks (constant lookup)
- Use `gen_random_uuid()` (cryptographic UUIDv4) for `id` and `token_family`
- No PII in this table beyond `user_id` (UUID FK)

## Next Steps

- Phase 02 consumes `RefreshTokenRepository` in `authService`
- DI wiring in `initialize/run.go` will inject this repo into `NewAuthService`
