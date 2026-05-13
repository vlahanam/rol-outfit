# Phase 2 — Frontend: `/me` API Resource

## Context
- `frontend/lib/api-resources.ts` exposes named resources (`adminUsers`, `adminProducts`, ...). No customer-facing `me` resource yet.
- `frontend/lib/api.ts` re-exports each resource on the `api` object (`api.adminUsers.list(...)`).
- `request<T>()` in `api-client.ts` already handles auth header injection + 401 refresh + retry. New resource just calls `request`.

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Add `me` resource: `get()`, `update(payload)`, `changePassword(payload)`. Wire into `api` object. Add types.

## Key Insights
- `User` type already exists in `types/api.ts`.
- `UpdateUserPayload` exists but includes admin-only fields (role, status, email). Do NOT reuse for `me.update` — create dedicated `UpdateMePayload` to mirror backend `UpdateMeRequest`.
- Backend returns `{ data: User }` for GET, 204 for PUT — same envelope as admin resources.

## Requirements
**Functional**
- `me.get(): Promise<{ data: User }>` → `GET /users/me`
- `me.update(body: UpdateMePayload): Promise<void>` → `PUT /users/me`
- `me.changePassword(body: ChangePasswordPayload): Promise<void>` → `PUT /users/me/password`

**Non-functional**
- Token attached automatically by `request()` — no manual auth handling.

## Architecture
```
Component → api.me.{get|update|changePassword}
            └─ request<T>(path, opts)
               └─ /api/v1/users/me[/password]
```

## Related Code Files
**Modify**
- `frontend/types/api.ts` — add `UpdateMePayload`, `ChangePasswordPayload`.
- `frontend/lib/api-resources.ts` — add `export const me = { ... }`.
- `frontend/lib/api.ts` — import `me`, add to `api` object, re-export named.

## Implementation Steps
1. In `types/api.ts` add:
   ```ts
   export interface UpdateMePayload {
     full_name?: string;
     address?: string;
     phone?: string;
   }
   export interface ChangePasswordPayload {
     current_password: string;
     new_password: string;
     confirm_password: string;
   }
   ```
2. In `api-resources.ts` add:
   ```ts
   export const me = {
     get(): Promise<{ data: User }> {
       return request<{ data: User }>(`/users/me`);
     },
     update(body: UpdateMePayload): Promise<void> {
       return request<void>(`/users/me`, { method: "PUT", body: JSON.stringify(body) });
     },
     changePassword(body: ChangePasswordPayload): Promise<void> {
       return request<void>(`/users/me/password`, { method: "PUT", body: JSON.stringify(body) });
     },
   };
   ```
   Update the type import block to include `UpdateMePayload`, `ChangePasswordPayload`.
3. In `api.ts` import `me` and add to the `api = { ... }` object.
4. Run `cd frontend && pnpm tsc --noEmit` (or project's typecheck script) to verify.

## Todo
- [ ] Add `UpdateMePayload` + `ChangePasswordPayload` to `types/api.ts`
- [ ] Add `me` resource to `api-resources.ts`
- [ ] Wire `me` into `api` object in `api.ts`
- [ ] Typecheck passes

## Success Criteria
- `import { me } from "@/lib/api-resources"` works.
- `api.me.get()` resolves to `{ data: User }` typed object at compile time.
- No new lint or type errors introduced.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Conflict with future global `me` import | L | L | Resource is namespaced as `api.me` for indirect use |
| Reusing `UpdateUserPayload` would surface admin fields to user UI | M | M | Created dedicated `UpdateMePayload` mirroring backend exactly |

## Security Considerations
- No tokens or secrets in payload types.
- Backend remains source of truth for which fields are accepted (extra fields are ignored by GORM update map).

## Next Steps
- Unblocks Phase 3 (UserContext consumes `me.get`).
- Unblocks Phase 5 (account forms consume `me.update` and `me.changePassword`).
