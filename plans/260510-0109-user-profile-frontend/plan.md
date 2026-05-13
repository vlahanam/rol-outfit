---
title: "Storefront User Profile & Account Page"
description: "Header shows logged-in user; new /account page for view/edit info + change password"
status: pending
priority: P2
effort: 5h
branch: develop
tags: [frontend, backend, auth, profile]
created: 2026-05-10
---

# User Profile & Storefront User Data

## Goal
- All storefront pages (`/`, `/shop`, `/new-arrivals`, `/cart`, `/product/*`) show the logged-in user in the Header.
- New `/account` route: view/edit profile (full_name, phone, address; email read-only) + change password.
- Add backend endpoint `PUT /api/v1/users/me/password`.

## Phases

| # | Phase | Status | Effort | Owner Files |
|---|-------|--------|--------|-------------|
| 1 | [Backend: Change Password Endpoint](./phase-01-backend-change-password.md) | pending | 1h | `backend/src/internal/{requests,services,controllers,initialize}/*` |
| 2 | [Frontend: `/me` API Resource](./phase-02-frontend-api-me.md) | pending | 30m | `frontend/lib/api-resources.ts`, `frontend/lib/api.ts`, `frontend/types/api.ts` |
| 3 | [Frontend: UserContext Provider](./phase-03-frontend-user-context.md) | pending | 1h | `frontend/contexts/user-context.tsx`, `frontend/components/MainLayout.tsx` |
| 4 | [Frontend: Header Auth-Aware Menu](./phase-04-frontend-header-menu.md) | pending | 1h | `frontend/components/Header.tsx`, `frontend/messages/{vi,en}.json` |
| 5 | [Frontend: Account Profile Page](./phase-05-frontend-account-page.md) | pending | 1.5h | `frontend/app/[locale]/(main)/account/page.tsx` |

## Dependency Graph
```
Phase 1 (backend)  ─┐
                    ├─→ Phase 5 (account page uses change-password)
Phase 2 (api/me)  ──┤
                    ├─→ Phase 3 (context uses me.get)
Phase 3 (context) ──┼─→ Phase 4 (header consumes context)
                    └─→ Phase 5 (account page uses context + me.update + me.changePassword)
```
- Phase 1 and Phase 2 can run in parallel.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phase 3.
- Phase 5 depends on Phase 1, Phase 2, Phase 3.

## Cross-Cutting Risks
- **JWT lacks `full_name`** → Header MUST fetch via API; cannot render name from token alone. Mitigation: UserContext fetches `GET /users/me` once on mount when logged in.
- **SSR / hydration mismatch** — `isLoggedIn()` returns `false` on server (no localStorage). Mitigation: render anonymous shell on server; UserContext hydrates on client.
- **Multi-tab logout** — `subscribeAuthEvents` already broadcasts. UserContext must clear user on `logout` event.
- **401 mid-session** — Existing `request()` already auto-refreshes and redirects to `/login`. Account page does not need extra logic.

## Backwards Compatibility
- Existing endpoints unchanged. New endpoint is additive.
- Login page, register page, admin pages: untouched.
- `getToken/isLoggedIn/clearAuth` API: untouched.

## Rollback Plan
- Each phase commits independently. To revert Phase N: git revert that commit; earlier phases remain functional (Header degrades gracefully — if context removed, fallback to existing User icon link).

## Docs Sync
After completion: update `docs/development-roadmap.md` (mark profile feature done) and `docs/project-changelog.md`.
