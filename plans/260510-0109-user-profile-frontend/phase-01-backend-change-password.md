# Phase 1 — Backend: Change Password Endpoint

## Context
- Adds `PUT /api/v1/users/me/password` to allow authenticated users to change their own password.
- Existing pattern: `controllers.UpdateMe` (uses `userID` from `ctx.Locals`, validates request, delegates to service, returns 204).
- bcrypt is already used by `userService.Create` (`golang.org/x/crypto/bcrypt`).

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** New self-service password change. Verifies current password before applying new hash.

## Key Insights
- JWT middleware already populates `userID` in `ctx.Locals`.
- Existing route group `me := v1.Group("/users", middleware.JWTAuth(jwtSecret))` is the correct mount point.
- Reuse `i18n` keys `validation.password.required` / `validation.password.length` (already in vi.json/ja.json).
- New i18n keys needed: `error.invalid_current_password`, `validation.confirm_password.mismatch`.

## Requirements
**Functional**
- Accept `{ current_password, new_password, confirm_password }`.
- Verify `current_password` against stored bcrypt hash.
- Verify `new_password === confirm_password`.
- Hash new password with bcrypt, update `password` column.
- Return 204 on success.

**Non-functional**
- 401 if not authenticated. 400 if validation fails. 401 if current password mismatches. 500 on internal error.
- Do NOT leak whether email/user exists in error reasons.

## Architecture
```
PUT /users/me/password
  └─ JWTAuth middleware → ctx.Locals("userID")
     └─ ChangeMyPassword(db) controller
        └─ requests.ChangePasswordRequest.Validate()
           └─ userService.ChangeMyPassword(ctx, userID, req)
              ├─ repo.FindByID(userID)
              ├─ bcrypt.CompareHashAndPassword(stored, current)
              ├─ bcrypt.GenerateFromPassword(new)
              └─ repo.Update(userID, {password: hash})
```

## Related Code Files
**Modify**
- `backend/src/internal/requests/user_request.go` — add `ChangePasswordRequest`.
- `backend/src/internal/services/user_service.go` — add `ChangeMyPassword` to `UserService` interface + impl; add `ErrInvalidCurrentPassword`.
- `backend/src/internal/controllers/user_controller.go` — add `ChangeMyPassword(db)` handler.
- `backend/src/internal/initialize/route.go` — register `me.Put("/me/password", controllers.ChangeMyPassword(db))`.
- `backend/src/internal/i18n/locales/vi.json` and `ja.json` — add 2 new keys.

## Implementation Steps
1. Add `ChangePasswordRequest{ CurrentPassword, NewPassword, ConfirmPassword string }` with `Validate()` enforcing required + length(8,100) + match check.
2. Add `ErrInvalidCurrentPassword = errors.New("invalid current password")` to service.
3. Add `ChangeMyPassword(ctx, id, req)` impl: find user, `bcrypt.CompareHashAndPassword` → on mismatch return `ErrInvalidCurrentPassword`; hash new; `repo.Update` with `{password: hash}`.
4. Add controller mirroring `UpdateMe` shape; map `ErrInvalidCurrentPassword` → 401 with `error.invalid_current_password`.
5. Register route under existing `me` group.
6. Add i18n keys: `error.invalid_current_password`, `validation.confirm_password.mismatch`.
7. Run `cd backend && go build ./...` to verify compilation.

## Todo
- [ ] Add `ChangePasswordRequest` struct + `Validate()`
- [ ] Extend `UserService` interface + impl with `ChangeMyPassword`
- [ ] Add `ErrInvalidCurrentPassword` sentinel
- [ ] Add `ChangeMyPassword` controller
- [ ] Register route in `initialize/route.go`
- [ ] Add 2 i18n keys (vi + ja)
- [ ] `go build ./...` passes
- [ ] Manual curl test: 204 on valid; 401 on wrong current; 400 on mismatch

## Success Criteria
- `PUT /api/v1/users/me/password` with valid body → 204.
- Wrong `current_password` → 401 `error.invalid_current_password`.
- Mismatch new/confirm → 400 with details.
- `new_password` length <8 → 400.
- Subsequent login uses new password.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Forget to invalidate refresh tokens of other devices | M | M | Out-of-scope this phase; document follow-up. Existing refresh token store is per-device. |
| Timing attack on current password compare | L | L | bcrypt.CompareHashAndPassword is constant-time |
| Rate limit absent | M | M | Out-of-scope; existing endpoints have no rate-limit either — note for future |

## Security Considerations
- Never log password values.
- Authorization: derive userID from JWT only — never accept a user ID in request body.
- Errors must not differentiate "user not found" vs "wrong current password" (same 401 reason).

## Next Steps
- Unblocks Phase 5 (account page Change Password form).
