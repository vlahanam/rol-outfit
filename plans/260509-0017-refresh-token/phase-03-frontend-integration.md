# Phase 03 — Frontend Integration

## Context Links

- Plan: [plan.md](./plan.md)
- Blocked by: [Phase 02](./phase-02-backend-auth-service.md)
- Related: `frontend/lib/api.ts`, `frontend/lib/auth.ts`, `frontend/types/api.ts`

## Overview

- **Priority:** high
- **Status:** completed
- **Description:** Add transparent token refresh on 401, multi-tab logout sync via BroadcastChannel, and `auth.logout()` API method. Concurrent 401s deduplicated via shared promise.

## Key Insights

- **Promise deduplication > boolean flag**: store the in-flight refresh `Promise<AuthTokens>` in a module variable; concurrent callers `await` the same promise, eliminating thundering-herd refreshes
- **Body buffering**: `fetch` consumes the request body stream once; for retry, serialize body to string before first call so retry can re-send
- **BroadcastChannel(`auth`)**: emits `{type:'logout'}` and `{type:'tokens-updated'}` events; other tabs listen and re-sync
- **Single-flight redirect**: only one tab/instance redirects to `/login` to avoid multi-tab navigation flicker
- **Refresh failure is terminal**: if refresh itself returns 401 → call `handleAuthFailure()` (clear + broadcast + redirect)
- **localStorage acceptable for now**: project stage permits it; future migration to httpOnly cookies tracked separately

## Requirements

**Functional:**
- `request()` retries once on 401 after successful refresh
- Concurrent in-flight 401s share single refresh request
- Tab A logout → Tab B receives broadcast → clears tokens → redirects within 1s
- `auth.logout()` calls `POST /api/v1/auth/logout` then clears local state regardless of response
- New tokens persisted to localStorage AND broadcast to other tabs

**Non-functional:**
- No memory leaks: BroadcastChannel cleaned up on unload (or accept GC for SPA)
- Refresh added latency budget: < 200ms for one round-trip
- Graceful degradation: BroadcastChannel unsupported → feature off, no crash

## Architecture

```
Concurrent Request Pattern:
  Request A ─┐
  Request B ─┼─ all 401 ─→ ensureTokenRefreshed()
  Request C ─┘                  │
                                ├─ if refreshPromise exists: await it
                                └─ else: refreshPromise = doRefresh()
                                          on success → setTokens + broadcast
                                          on fail    → handleAuthFailure
                                          finally    → refreshPromise = null
                              ↓
              all three retry with new access token

Multi-tab Sync:
  Tab A: clearAuth()        Tab B: bc.onmessage = (e) =>
   └─ bc.postMessage(           if e.data.type === 'logout':
        {type:'logout'})           clearLocal() + redirect
```

## Related Code Files

**Modify:**
- `frontend/lib/auth.ts` — add `getRefreshToken`, BroadcastChannel setup, broadcast in `clearAuth`/`setTokens`
- `frontend/lib/api.ts` — add `ensureTokenRefreshed`, `handleAuthFailure`, retry logic in `request()`, `auth.logout()`

**Read for context:**
- `frontend/types/api.ts` (AuthTokens type)
- Phase 02 endpoint contracts

## Implementation Steps

1. **Update `lib/auth.ts`:**
   - Add `getRefreshToken(): string | null` reading `REFRESH_KEY` from localStorage
   - Module-level `const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth') : null`
   - Modify `clearAuth()`: after clearing localStorage, `authChannel?.postMessage({type:'logout'})`
   - Modify `setTokens(tokens)`: after writing localStorage, `authChannel?.postMessage({type:'tokens-updated'})`
   - Export `subscribeAuthEvents(handler)` so app root can listen and react (logout → router.replace('/login'))
2. **Update `lib/api.ts`:**
   - Module-level `let refreshPromise: Promise<AuthTokens> | null = null`
   - `async function doRefresh(): Promise<AuthTokens>`: POST to `/api/v1/auth/refresh` with `getRefreshToken()`; on 401 → throw; on success → `setTokens(data)` + return
   - `async function ensureTokenRefreshed(): Promise<AuthTokens>`:
     - if `refreshPromise` exists, return it
     - else `refreshPromise = doRefresh().finally(() => { refreshPromise = null })`
     - return `refreshPromise`
   - `function handleAuthFailure()`: `clearAuth()` (which broadcasts) + `if (typeof window !== 'undefined') window.location.href = '/login'`
   - Refactor `request<T>(path, opts)`:
     - Pre-serialize body to string (if object) ONCE, store in `bodyStr`
     - First fetch → if status === 401 AND `getRefreshToken()` exists AND not already a refresh call → `try { await ensureTokenRefreshed() } catch { handleAuthFailure(); throw }` → retry fetch with new access token + same `bodyStr`
     - If retry also 401 → `handleAuthFailure()` + throw
     - Other errors propagate as before
   - Add `auth.logout()` exported method: try POST `/api/v1/auth/logout` with refresh token (best-effort, swallow network errors), then `clearAuth()` (broadcasts logout)
3. **Wire app-level subscriber** (in root layout/provider): on `subscribeAuthEvents` `logout` → router redirect to `/login`. Keep change minimal — single hook in existing auth provider.
4. **Compile check** — `cd frontend && pnpm build` (or `npm run build`).
5. **Manual test**:
   - Open two tabs logged in → click logout in Tab A → verify Tab B redirects to /login within 1s
   - Force expired access token (set short TTL on backend or wait) → call any authenticated API → verify silent retry succeeds
   - Trigger 5 simultaneous API calls when access expired → verify only ONE `/refresh` request in network tab

## Todo List

- [x] Add `getRefreshToken()` helper
- [x] Init BroadcastChannel in auth.ts (with feature-detect)
- [x] Broadcast in `clearAuth` + `setTokens`
- [x] Export `subscribeAuthEvents` and wire in app provider
- [x] Add `doRefresh` + `ensureTokenRefreshed` (promise dedup)
- [x] Add `handleAuthFailure`
- [x] Refactor `request()` with body buffer + 401 retry
- [x] Add `auth.logout()` API method
- [x] Build passes (`pnpm build` or `npm run build`)
- [x] Manual multi-tab logout test passes
- [x] Manual silent-refresh test passes
- [x] Network tab shows single refresh for concurrent 401s

## Success Criteria

- User session survives access token expiry without visible interruption
- Concurrent 401s produce exactly one `/refresh` network call
- Logout in one tab logs out all tabs within 1s
- Refresh failure → user redirected to login + tokens cleared
- No infinite retry loops (max 1 retry per request)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Body stream consumed before retry | High if missed | Retry sends empty body | Buffer body to string before first fetch |
| BroadcastChannel unsupported (older browsers) | Low | Multi-tab unsynced | Feature-detect + fallback to no-op (not a crash) |
| Infinite refresh loop | Med | Browser hang | Skip retry if path === `/auth/refresh` itself |
| Promise dedup race | Low | Double refresh | `finally` clears promise — atomic in JS event loop |
| Refresh succeeds but localStorage write fails | Very Low | Tokens lost | Try/catch around storage write; treat as auth failure |

## Security Considerations

- Refresh token transmitted in JSON body over HTTPS (not URL — no log leakage)
- BroadcastChannel scope = same origin only (browser-enforced)
- No tokens logged to console; error objects sanitized before logging
- Logout API call best-effort: even if network fails, local state is cleared
- localStorage limitation acknowledged — XSS = total compromise; mitigated via CSP + future migration to httpOnly cookies

## Next Steps

- Update `docs/development-roadmap.md` + `docs/project-changelog.md` with refresh token feature
- Future hardening: migrate refresh token to httpOnly + Secure + SameSite cookie; access token can stay in memory
- Future: add device/session list UI (uses existing `refresh_tokens` table)
